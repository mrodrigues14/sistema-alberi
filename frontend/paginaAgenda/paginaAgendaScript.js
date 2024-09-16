let calendar;

document.addEventListener('DOMContentLoaded', async function() {
    try {
        showLoadingSpinner();
        await loadTemplateAndStyles();
        await checkGoogleLoginAndLoadEvents();
        await loadCalendars();
    } catch (error) {
        console.error('Erro ao carregar o template ou eventos:', error);
    } finally {
        hideLoadingSpinner();  // Esconde o spinner após carregar a página
    }
});

async function loadTemplateAndStyles() {
    const cachedCSS = localStorage.getItem('templateCSS');
    const cachedHTML = localStorage.getItem('templateHTML');

    if (cachedCSS && cachedHTML) {
        applyCSS(cachedCSS);
        applyHTML(cachedHTML);
    } else {
        const [cssData, htmlData] = await Promise.all([
            fetchText('/templateMenu/styletemplate.css'),
            fetchText('/templateMenu/template.html')
        ]);

        localStorage.setItem('templateCSS', cssData);
        localStorage.setItem('templateHTML', htmlData);

        applyCSS(cssData);
        applyHTML(htmlData);
    }

    const script = document.createElement('script');
    script.src = '/templateMenu/templateScript.js';
    script.onload = function() {
        loadAndDisplayUsername();
        handleEmpresa();
        loadNomeEmpresa();
    };
    document.body.appendChild(script);
}

function fetchText(url) {
    return fetch(url).then(response => response.text());
}

function applyCSS(cssData) {
    const style = document.createElement('style');
    style.textContent = cssData;
    document.head.appendChild(style);
}

function applyHTML(htmlData) {
    document.getElementById('menu-container').innerHTML = htmlData;
}

async function checkGoogleLoginAndLoadEvents() {
    const userResponse = await fetch('/api/usuario-logado');
    if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('Usuário logado:', userData);

        const googleResponse = await fetch(`/agenda/check-login/${userData.idusuario}`);
        if (googleResponse.ok) {
            const events = await loadGoogleCalendarEvents();
            initializeFullCalendar(events);
        } else if (googleResponse.status === 401) {
            console.log('Usuário não autenticado com o Google, redirecionando para login...');
            window.location.href = '/agenda/auth';
        }
    } else {
        window.location.href = '/agenda/auth';
    }
}

function setupGoogleLoginButton() {
    const loginButton = document.getElementById('google-login-btn');
    loginButton.addEventListener('click', function() {
        window.location.href = '/agenda/auth';
    });
}

async function loadGoogleCalendarEvents() {
    try {
        const response = await fetch('/agenda/list-events');
        const events = await response.json();
        console.log(events);
        return events.map(event => {
            // Verifica se o evento é de dia inteiro (se o campo date está presente ao invés de dateTime)
            const isAllDay = !!event.start.date && !!event.end.date;
            return {
                id: event.id,
                title: event.summary,
                start: event.start.dateTime || event.start.date, // Se for dia inteiro, usa date
                end: event.end?.dateTime || event.end?.date, // Se for dia inteiro, usa date
                description: event.description || '',
                participants: event.attendees ? event.attendees.map(att => att.email) : [],
                calendarId: event.organizer?.email || 'primary',
                calendarName: event.organizer?.displayName || 'Principal',
                allDay: isAllDay // Define se o evento é de dia inteiro
            };
        });
    } catch (error) {
        console.error('Erro ao carregar eventos do Google Calendar:', error);
        return [];
    }
}

function initializeFullCalendar(events) {
    const calendarEl = document.getElementById('calendar-container');

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today calendarSelect',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: events,
        locale: 'pt-br', // Define o idioma como português brasileiro
        editable: true,
        selectable: true,
        select: function(info) {
            openModal({
                start: info.startStr,
                end: info.endStr
            });
        },
        customButtons: {
            calendarSelect: {
                text: 'Selecionar Agendas',
                click: function() {
                    openCalendarSelectModal();
                }
            }
        },
        buttonText: {
            today: "Hoje",
            month: "Mês",
            week: "Semana",
            day: "Dia"
        },
        eventClick: function(info) {
            const isAllDay = info.event.allDay; // Verifica se é dia inteiro

            const event = {
                id: info.event.id,
                title: info.event.title,
                start: info.event.start,
                end: info.event.end,
                description: info.event.extendedProps.description,
                participants: info.event.extendedProps.participants,
                calendarId: info.event.extendedProps.calendarId,
                calendarName: info.event.extendedProps.calendarName,
                allDay: isAllDay // Adiciona a flag de "dia inteiro"
            };
            openViewModal(event); // Abre o modal de visualização
        },
        eventDrop: function(info) {
            const isAllDay = info.event.allDay; // Verifica se o evento é de dia inteiro

            const event = {
                id: info.event.id,
                title: info.event.title,
                start: info.event.startStr, // Usa startStr para o novo horário
                end: info.event.endStr, // Usa endStr para o novo horário
                description: info.event.extendedProps.description || '',  // Adiciona a descrição se existir
                participants: info.event.extendedProps.participants || [],  // Adiciona os participantes se existirem
                calendarId: info.event.extendedProps.calendarId || 'primary',  // Adiciona o calendarId correto
                allDay: isAllDay // Inclui a flag `allDay` para garantir que o valor seja enviado
            };

            // Atualiza o evento após ser arrastado
            updateGoogleCalendarEvent(event);
        }
    });

    calendar.render();
}

function openViewModal(event) {
    const modal = document.getElementById('viewEventModal');
    modal.style.display = 'block';

    document.getElementById('viewEventTitle').textContent = event.title || '';
    document.getElementById('viewEventStart').textContent = new Date(event.start).toLocaleString() || '';
    document.getElementById('viewEventEnd').textContent = new Date(event.end).toLocaleString() || '';
    document.getElementById('viewEventDescription').textContent = event.description || 'Sem descrição';
    document.getElementById('viewEventParticipants').textContent = (event.participants || []).join(', ') || 'Nenhum participante';
    document.getElementById('viewEventCalendar').textContent = event.calendarName || 'Principal';

    // Botões de editar e deletar
    document.getElementById('editEventButton').onclick = function() {
        openModal({
            id: event.id,
            title: event.title,
            start: event.start,
            end: event.end,
            description: event.description,
            participants: event.participants,
            calendarId: event.calendarId,
            allDay: event.allDay  // Aqui passamos se é "Dia Inteiro"
        });
        closeViewModal();
    };

    document.getElementById('deleteEventButton').onclick = function() {
        if (confirm('Tem certeza que deseja deletar este evento?')) {
            deleteGoogleCalendarEvent(event.id, event.calendarId);  // Usando o calendarId real
            closeViewModal();
        }
    };
}

function closeViewModal() {
    document.getElementById('viewEventModal').style.display = 'none';
}

function openModal(event = {}) {
    const modal = document.getElementById('eventModal');
    modal.style.display = 'block';

    document.getElementById('eventId').value = event.id || '';
    document.getElementById('eventTitle').value = event.title || '';

    // Verifica se o evento é de dia inteiro
    const isAllDay = event.allDay !== undefined ? event.allDay : false;
    document.getElementById('eventAllDay').checked = isAllDay;
    toggleTimeFields(); // Atualiza os campos de hora com base no valor de dia inteiro

    // Define a data de início e fim
    const startDate = event.start ? new Date(event.start).toISOString().split('T')[0] : '';
    const endDate = event.end ? new Date(event.end).toISOString().split('T')[0] : '';
    document.getElementById('eventStartDate').value = startDate;
    document.getElementById('eventEndDate').value = endDate;

    if (!isAllDay) {
        // Formata o horário local corretamente para o campo de horas
        const startTime = event.start ? new Date(event.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
        const endTime = event.end ? new Date(event.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
        document.getElementById('eventStartTime').value = startTime;
        document.getElementById('eventEndTime').value = endTime;
    } else {
        document.getElementById('eventStartTime').value = '';
        document.getElementById('eventEndTime').value = '';
    }

    document.getElementById('eventDescription').value = event.description || '';
    document.getElementById('eventParticipants').value = (event.participants || []).join(', ');

    const calendarDropdown = document.getElementById('eventCalendar');
    calendarDropdown.value = event.calendarId || 'primary';
}

function closeModal() {
    document.getElementById('eventModal').style.display = 'none';
}

document.getElementById('eventForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const eventId = document.getElementById('eventId').value;
    const title = document.getElementById('eventTitle').value;
    const allDay = document.getElementById('eventAllDay').checked;
    const startDate = document.getElementById('eventStartDate').value;
    const endDate = allDay ? startDate : document.getElementById('eventEndDate').value;
    const startTime = allDay ? null : document.getElementById('eventStartTime').value;
    const endTime = allDay ? null : document.getElementById('eventEndTime').value;
    const description = document.getElementById('eventDescription').value;
    const participants = document.getElementById('eventParticipants').value.split(',').map(email => email.trim());
    const calendarId = document.getElementById('eventCalendar').value;

    const start = allDay ? startDate : `${startDate}T${startTime}:00`;
    const end = allDay ? startDate : `${endDate}T${endTime}:00`;

    const newEvent = {
        title,
        start,
        end,
        description,
        participants,
        calendarId,
        allDay
    };

    if (eventId) {
        updateGoogleCalendarEvent({ ...newEvent, id: eventId });
    } else {
        addNewEventToGoogleCalendar(newEvent);
    }

    closeModal();
});

function toggleTimeFields() {
    const isAllDay = document.getElementById('eventAllDay').checked;
    const startTimeContainer = document.getElementById('startTimeContainer');
    const endTimeContainer = document.getElementById('endTimeContainer');
    const endDateContainer = document.getElementById('endDateContainer');

    if (isAllDay) {
        startTimeContainer.style.display = 'none';
        endTimeContainer.style.display = 'none';
        endDateContainer.style.display = 'none'; // Esconde o campo de "Data Final"
    } else {
        startTimeContainer.style.display = 'block';
        endTimeContainer.style.display = 'block';
        endDateContainer.style.display = 'block'; // Mostra o campo de "Data Final"
    }
}

async function addNewEventToGoogleCalendar(event) {
    console.log(event);
    try {
        const validParticipants = event.participants
            .filter(email => validateEmail(email)) // Filtra apenas e-mails válidos
            .map(email => ({ email }));

        const eventData = {
            allDay: event.allDay,
            title: event.title,
            description: event.description || '',
            participants: validParticipants,
            calendarId: event.calendarId || 'primary'
        };

        if (event.allDay) {
            eventData.start = { date: event.start };
            eventData.end = { date: event.end };
        } else {
            eventData.start = { dateTime: new Date(event.start).toISOString(), timeZone: 'America/Sao_Paulo' };
            eventData.end = { dateTime: new Date(event.end).toISOString(), timeZone: 'America/Sao_Paulo' };
        }

        const response = await fetch('/agenda/add-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });

        if (response.ok) {
            console.log('Evento adicionado com sucesso');
            await refreshCalendar(); // Atualiza o calendário após adicionar evento
        } else {
            console.error('Erro ao adicionar evento.');
        }
    } catch (error) {
        console.error('Erro ao adicionar evento ao Google Calendar:', error);
    }
}

async function updateGoogleCalendarEvent(event) {
    try {
        const validParticipants = event.participants
            .filter(email => validateEmail(email))
            .map(email => ({ email }));

        const eventData = {
            title: event.title,
            description: event.description || '',
            participants: validParticipants,
            calendarId: event.calendarId || 'primary',
            allDay: event.allDay
        };

        if (event.allDay) {
            eventData.start = { date: event.start };
            eventData.end = { date: event.end };
        } else {
            eventData.start = { dateTime: new Date(event.start).toISOString(), timeZone: 'America/Sao_Paulo' };
            eventData.end = { dateTime: new Date(event.end).toISOString(), timeZone: 'America/Sao_Paulo' };
        }

        const response = await fetch(`/agenda/edit-event/${event.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });

        if (response.ok) {
            console.log('Evento atualizado com sucesso');
            await refreshCalendar(); // Atualiza o calendário após editar evento
        } else {
            console.error('Erro ao atualizar evento.');
        }
    } catch (error) {
        console.error('Erro ao atualizar evento no Google Calendar:', error);
    }
}

async function deleteGoogleCalendarEvent(eventId, calendarId) {
    try {
        const response = await fetch(`/agenda/delete-event/${eventId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ calendarId: calendarId || 'primary' })
        });

        if (response.ok) {
            console.log('Evento deletado com sucesso');
            await refreshCalendar(); // Atualiza o calendário após deletar evento
        } else {
            console.error('Erro ao deletar evento.');
        }
    } catch (error) {
        console.error('Erro ao deletar evento do Google Calendar:', error);
    }
}

async function refreshCalendar() {
    try {
        const events = await loadGoogleCalendarEvents(); // Recarrega os eventos
        calendar.removeAllEvents(); // Remove os eventos antigos
        calendar.addEventSource(events); // Adiciona os novos eventos
        console.log('Calendário atualizado com sucesso');
    } catch (error) {
        console.error('Erro ao atualizar o calendário:', error);
    }
}

async function loadCalendars() {
    try {
        const response = await fetch('/agenda/list-calendars');
        const calendars = await response.json();
        const calendarSelectDiv = document.getElementById('calendarSelect');

        // Limpa o conteúdo antes de adicionar novos itens
        calendarSelectDiv.innerHTML = '';

        calendars.forEach(calendar => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `calendar-${calendar.id}`;
            checkbox.value = calendar.id;
            checkbox.checked = true; // Todas as agendas selecionadas por padrão

            const label = document.createElement('label');
            label.htmlFor = `calendar-${calendar.id}`;
            label.textContent = calendar.summary;

            const div = document.createElement('div');
            div.appendChild(checkbox);
            div.appendChild(label);
            calendarSelectDiv.appendChild(div);
        });

    } catch (error) {
        console.error('Erro ao carregar as agendas:', error);
    }
}

async function applySelectedCalendars() {
    try {
        showLoadingSpinner();  // Mostra o spinner ao aplicar a seleção de agendas

        const selectedCalendars = Array.from(document.querySelectorAll('#calendarSelect input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);

        // Carregar todos os eventos
        const allEvents = await loadGoogleCalendarEvents();

        // Filtrar os eventos com base nas agendas selecionadas
        const filteredEvents = allEvents.filter(event => selectedCalendars.includes(event.calendarId));

        // Atualiza o calendário com os eventos filtrados
        calendar.removeAllEvents();  // Remove os eventos antigos
        calendar.addEventSource(filteredEvents);  // Adiciona os novos eventos

        // Fechar o modal
        closeCalendarSelectModal();
    } catch (error) {
        console.error('Erro ao aplicar agendas selecionadas:', error);
    } finally {
        hideLoadingSpinner();  // Esconde o spinner após a aplicação
    }
}
function openCalendarSelectModal() {
    document.getElementById('calendarSelectModal').style.display = 'block';
    document.getElementById('modalOverlay').style.display = 'block'; // Mostrar o overlay
}

function closeCalendarSelectModal() {
    document.getElementById('calendarSelectModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none'; // Ocultar o overlay
}



function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}
function showLoadingSpinner() {
    document.getElementById('loadingSpinner').style.display = 'block';
    document.querySelector('#calendar-container').classList.add('blur-background');
}

// Função para esconder o spinner e remover o desfoque
function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').style.display = 'none';
    document.querySelector('#calendar-container').classList.remove('blur-background');
}