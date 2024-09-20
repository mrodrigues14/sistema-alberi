const express = require('express');
const router = express.Router();
const path = require('path');
const { google } = require('googleapis');
const { saveGoogleTokens, getUserGoogleTokens } = require("../repositories/agenda.repository");
require('dotenv').config();


const oauth2Client = new google.auth.OAuth2(
    process.env.OAUTH_CLIENT_ID,
    process.env.OAUTH_CLIENT_SECRET,
    process.env.OAUTH_REDIRECT_URI
);

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaAgenda/paginaAgenda.html'));
});

router.get('/auth', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events']
    });
    res.redirect(authUrl);
});

router.get('/oauth2callback', async (req, res) => {
    const code = req.query.code;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        console.log(req.session,req.session.idusuario,req.session)
        // if (!req.session || !req.session.idusuario) {
        //     return res.status(401).send('Usuário não autenticado para salvar tokens');
        // }

        req.session.tokens = tokens;
        await saveGoogleTokens(req.session.idusuario, tokens);

        res.redirect('/agenda');
    } catch (error) {
        console.error('Erro ao autenticar com o Google:', error);
        res.status(500).send('Erro ao autenticar');
    }
});

// Função para garantir que o token esteja válido antes de fazer a chamada para a API
async function ensureValidToken(req, res, next) {
    const userId = req.session.idusuario;
    const userTokens = await getUserGoogleTokens(userId);

    if (!userTokens) {
        return res.status(401).send('Usuário não vinculado ao Google Calendar.');
    }

    oauth2Client.setCredentials({
        access_token: userTokens.google_access_token,
        refresh_token: userTokens.google_refresh_token
    });

    try {
        // Tente obter um novo access token, se o atual estiver expirado
        const { credentials } = await oauth2Client.refreshAccessToken();

        // Atualiza o token no banco de dados
        await saveGoogleTokens(userId, credentials);

        next(); // Continua para a próxima função na rota
    } catch (error) {
        console.error('Erro ao renovar o token:', error);
        res.status(401).send('Erro ao renovar o token.');
    }
}


router.get('/list-events', ensureValidToken, async (req, res) => {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
        const calendarsResponse = await calendar.calendarList.list();
        const calendars = calendarsResponse.data.items;

        if (!calendars || calendars.length === 0) {
            return res.status(404).send('Nenhum calendário encontrado.');
        }

        let allEvents = [];
        for (let i = 0; i < calendars.length; i++) {
            const calendarId = calendars[i].id;
            const eventsResponse = await calendar.events.list({
                calendarId: calendarId,
                timeMin: (new Date()).toISOString(),
                maxResults: 10,
                singleEvents: true,
                orderBy: 'startTime',
            });

            const events = eventsResponse.data.items;
            if (events && events.length > 0) {
                allEvents = allEvents.concat(events);
            }
        }

        res.json(allEvents);
    } catch (error) {
        console.error('Erro ao listar eventos:', error);
        res.status(500).send('Erro ao listar eventos.');
    }
});

router.post('/add-event', ensureValidToken, async (req, res) => {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const newEvent = {
        summary: req.body.title,
        description: req.body.description || '',
        attendees: req.body.participants?.map(email => ({ email })) || [],
    };

    const formatDateTimeWithOffset = (dateTime) => {
        const dateObj = new Date(dateTime);
        const offset = -3; // Fuso horário -03:00
        const timezoneOffset = (offset >= 0 ? '+' : '-') + ('0' + Math.abs(offset)).slice(-2) + ':00';
        const dateTimeWithOffset = dateObj.toISOString().split('.')[0] + timezoneOffset;
        return dateTimeWithOffset;
    };

    if (req.body.allDay) {
        console.log('Evento de dia inteiro:', req.body.start);
        newEvent.start = { date: req.body.start.date };
        newEvent.end = { date: req.body.start.date };
    } else {
        console.log('Evento com hora:', req.body.start, req.body.end);
        newEvent.start = {
            dateTime: formatDateTimeWithOffset(req.body.start.dateTime),
            timeZone: req.body.start.timeZone || 'America/Sao_Paulo'
        };
        newEvent.end = {
            dateTime: formatDateTimeWithOffset(req.body.end.dateTime),
            timeZone: req.body.end.timeZone || 'America/Sao_Paulo'
        };
    }

    console.log('Novo evento:', newEvent);

    const calendarId = req.body.calendarId || 'primary';

    try {
        const response = await calendar.events.insert({
            calendarId: calendarId,
            resource: newEvent
        });
        res.json(response.data);
    } catch (error) {
        console.error('Erro ao adicionar evento:', error);
        res.status(500).send('Erro ao adicionar evento.');
    }
});

router.put('/edit-event/:eventId', ensureValidToken, async (req, res) => {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const updatedEvent = {
        summary: req.body.title,
        description: req.body.description || '',
        attendees: req.body.participants?.filter(email => validateEmail(email)).map(email => ({ email })) || []
    };

    if (req.body.allDay) {
        updatedEvent.start = { date: req.body.start.date };
        updatedEvent.end = { date: req.body.start.date };
    } else {
        updatedEvent.start = { dateTime: req.body.start, timeZone: 'America/Sao_Paulo' };
        updatedEvent.end = { dateTime: req.body.end, timeZone: 'America/Sao_Paulo' };
    }

    const calendarId = req.body.calendarId || 'primary';

    try {
        const response = await calendar.events.update({
            calendarId: calendarId,
            eventId: req.params.eventId,
            resource: updatedEvent
        });
        res.json(response.data);
    } catch (error) {
        console.error('Erro ao atualizar evento:', error);
        res.status(500).send('Erro ao atualizar evento.');
    }
});

router.delete('/delete-event/:eventId', ensureValidToken, async (req, res) => {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const calendarId = req.body.calendarId || 'primary';

    try {
        await calendar.events.delete({
            calendarId: calendarId,
            eventId: req.params.eventId
        });
        res.send('Evento deletado com sucesso.');
    } catch (error) {
        console.error('Erro ao deletar evento:', error);
        res.status(500).send('Erro ao deletar evento.');
    }
});

router.get('/list-calendars', ensureValidToken, async (req, res) => {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
        const calendarsResponse = await calendar.calendarList.list();
        const calendars = calendarsResponse.data.items;
        res.json(calendars);
    } catch (error) {
        console.error('Erro ao listar agendas:', error);
        res.status(500).send('Erro ao listar agendas.');
    }
});

router.get('/check-login/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const tokens = await getUserGoogleTokens(userId);

        if (tokens && tokens.google_access_token) {
            oauth2Client.setCredentials({
                access_token: tokens.google_access_token,
                refresh_token: tokens.google_refresh_token
            });

            req.session.tokens = {
                access_token: tokens.google_access_token,
                refresh_token: tokens.google_refresh_token
            };

            res.status(200).json({ message: 'Token do Google válido' });
        } else {
            res.status(401).json({ message: 'Token do Google não encontrado, é necessário login.' });
        }
    } catch (error) {
        console.error('Erro ao verificar o token do Google:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

router.post('/save-token', async (req, res) => {
    const { googleToken } = req.body;

    if (!req.session || !req.session.idusuario) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const userId = req.session.idusuario;
    try {
        await saveGoogleTokens(userId, googleToken);
        res.status(200).json({ message: 'Token do Google salvo com sucesso' });
    } catch (error) {
        console.error('Erro ao salvar o token do Google:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

module.exports = router;

