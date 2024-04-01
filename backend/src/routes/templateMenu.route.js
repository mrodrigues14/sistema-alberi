const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/templateMenu/template.html'));
});

app.get('/logout', function(req, res){
    req.session.destroy(function(err) {
        if(err) {
            console.log(err);
        } else {
            res.redirect('/api/login');
        }
    });
});

module.exports = router;
