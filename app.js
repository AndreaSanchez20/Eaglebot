/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var cognitiveservices = require('botbuilder-cognitiveservices');
var facebook = require('botbuilder-facebookextension');
var azure = require('botbuilder-azure'); 
  
var url = require('url');
var fs = require('fs');
var util = require('util');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Cosmos BD
var documentDbOptions = {
    host: 'https://datosbotret.documents.azure.com:443/', 
    masterKey: 'McOPCi7mtfRqOr1UJazlANIhck3jQ4jSebKl80iTy8R4qhERYiE5CS8BxJi0khNIR5cjRo1rwBKxfO0dMDEpzg==', 
    database: 'datosbotret',   
    collection: 'ToDoList'
};
var docDbClient = new azure.DocumentDbClient(documentDbOptions);
var cosmosStorage = new azure.AzureBotStorage({ gzipData: false }, docDbClient);

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    stateEndpoint: process.env.BotStateEndpoint,
    openIdMetadata: process.env.BotOpenIdMetadata
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector).set('storage', cosmosStorage);
//bot.set('persistConversationData', false);
//bot.set('persistUserData', false);
// Configure bots default locale and locale folder path.
bot.set('localizerSettings', {
    botLocalePath: "./customLocale",
    defaultLocale: "es"
});
// facebook
/*bot.use(
    facebook.RetrieveUserProfile({
        accessToken: process.env.FacebookAccessToken
        //'EAAE6uOZBnnoUBAKLDQgfdQBTizwVJBB0fpTncMXNqrsGzAzu3196zbfm9gvZB9pZBgd3T03TMQJe8cErZA3SjmrPT2OjCqtpbrkMYk5PLRKgLQ3io3qn5y6UUnfy6jMuLytxyhgVBlTQVYgZAnJ6ltOSKISIKTOSl2OsVAxcPl3GmwnS6yp3n'
        ,
        //expireMinutes: 60, // OPTIONAL 
        fields: ['first_name', 'last_name'] // OPTIONAL 
    })
);*/
// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

//var LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;
//var LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v2.0/apps/' + luisAppId + '?subscription-key=' + luisAPIKey+'&verbose=true&timezoneOffset=0';
var LuisModelUrl = ' 	https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/1d0db625-7fad-4ffc-814a-f9a7ded1d137?subscription-key=1073ac46709b448398b17280ecdbbb1e&verbose=true&timezoneOffset=0';

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);

var qnarecognizer = new cognitiveservices.QnAMakerRecognizer({
    //knowledgeBaseId: process.env.QnAKnowledgebaseId,
    //authKey: process.env.QnASubscriptionKey,
   // knowledgeBaseId: '6ea28eed-13a5-4a62-9db9-ffff91bd8318',
   // authKey: '934b81b8-c3b5-4e72-950a-45e5d052e57e',
   // endpointHostName: 'https://customerservicebotsqna.azurewebsites.net/qnamaker',
    knowledgeBaseId: '6ea28eed-13a5-4a62-9db9-ffff91bd8318',
    authKey: '934b81b8-c3b5-4e72-950a-45e5d052e57e',
    endpointHostName: 'https://customerservicebotsqna.azurewebsites.net/qnamaker',
    top: 4
});

var intents = new builder.IntentDialog({ recognizers: [recognizer,qnarecognizer] });
/*
.matches('<yourIntent>')... See details at http://docs.botframework.com/builder/node/guides/understanding-natural-language/

.onDefault((session) => {
    session.send('Sorry, I did not understand \'%s\'.', session.message.text);
});*/

bot.dialog('/', intents);
bot.dialog('/Menu', [
    (session) => {
        var salida='';
        for(var p in process.env){
            salida+=p + ': ' + process.env[p] + ' \n';
        }
        //console.log("%s",salida);
        var Menu_OP1_PreguntasV = session.localizer.gettext(session.preferredLocale(), "Menu_OP1_PreguntasV");
        var PreguntasImg = session.localizer.gettext(session.preferredLocale(), "PreguntasImg");
        var PreguntaVinculo = session.localizer.gettext(session.preferredLocale(), "PreguntaVinculo");
        var ImgCita = session.localizer.gettext(session.preferredLocale(), "ImgCita");
        var ImgAcerca = session.localizer.gettext(session.preferredLocale(), "ImgAcerca");
//
        var Menu_op2_text = session.localizer.gettext(session.preferredLocale(), "Menu_op2_text");
        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
        //.attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments([
            new builder.HeroCard(session)
                .title("Menu_T1")
            // .subtitle("Como puedo ayudarte?")
            //.text("Presiona un boton!.")
                .images([
                builder.CardImage.create(session, PreguntasImg)
                //  builder.CardImage.create(session,'./IMG/uno.png', 'image/png','uno.png')
            ])
                .buttons([
                //builder.CardAction.dialogAction(session, 'Preguntas', '/Preguntas', "Menu_op1"),
                builder.CardAction.imBack(session, Menu_OP1_PreguntasV, "Menu_op1"),
                builder.CardAction.openUrl(session, PreguntaVinculo, "Menu_Guia")
            ]),
            new builder.HeroCard(session)
                .title("Menu_T2")
            // .subtitle("Como puedo ayudarte?")
            //.text("Presiona un boton!.")
                .images([
                builder.CardImage.create(session, ImgCita)
                //  builder.CardImage.create(session,'./IMG/uno.png', 'image/png','uno.png')
            ])
                .buttons([
                //builder.CardAction.dialogAction(session, 'Citas', 'quiero una cita', "Menu_op2"),// /Citas
                builder.CardAction.imBack(session, Menu_op2_text, "Menu_op2")
                /* builder.CardAction.dialogAction(session,"Despedida",'','Despedida')*/
            ]),
            new builder.HeroCard(session)
                .title("Menu_T3")
            // .subtitle("Como puedo ayudarte?")
            //.text("Presiona un boton!.")
                .images([
                builder.CardImage.create(session, ImgAcerca)
                //  builder.CardImage.create(session,'./IMG/uno.png', 'image/png','uno.png')
            ])
                .buttons([
                builder.CardAction.dialogAction(session, 'Acerca', '/Acerca', "Menu_op3"),
                /* builder.CardAction.imBack(session,'(quit)','Salir')*/
                /* builder.CardAction.dialogAction(session,"Despedida",'','Despedida')*/
            ])
        ]);
        session.endDialog(msg);
    }
]).triggerAction({
    matches: /^menu$/i,
    onSelectAction: (session, args, next) => {
        session.beginDialog(args.action, args);
    }
});
// dialogos activados por boton!
bot.beginDialogAction('Menu..','/Menu');
bot.beginDialogAction('Citas', '/Citas');//
bot.beginDialogAction('Ayuda', '/Ayuda');
bot.beginDialogAction('Acerca', '/Acerca');
bot.beginDialogAction('Despedida', '/Adios');
bot.beginDialogAction('Preguntas', '/Preguntas');
bot.beginDialogAction('PreguntasFrecuentes', '/PreguntasFrecuentes');
bot.beginDialogAction('Opciones', '/Opciones');
bot.beginDialogAction('Dialogo', '/');
bot.beginDialogAction('Cancelar', '/Cancelar');
bot.beginDialogAction('Consultar', '/Consultar');
bot.beginDialogAction('citaDetalles','/citaDetalles');
//bot.dialog('/Proceso', intents);
// Intents especificos del Luis.ai
intents.matches('Saludos', '/Ayuda');
/*
    intents.matches('idioma', (session)=>{
    session.sendTyping();// Escribiendo ...
    session.beginDialog("/localePickerDialog");
});*/
intents.matches('Ayuda', '/Ayuda');
intents.matches('Despedida', (session, results)=>{
    //inicia un dialogo especifico
    session.send("Despedida");
    });
intents.matches('Citas', '/Citas');
// Intens del QNA Maker
intents.matches('qna', [
    (session, args, next) => {
    session.sendTyping();
    session.conversationData.pregunta = "";
    session.conversationData.paso = 0;
    session.conversationData.pasoM = 1;
        var answerEntity = builder.EntityRecognizer.findEntity(args.entities, 'answer');
        if(answerEntity.entity.indexOf("[PF]") != -1){
        var inicioMas = "[PF]";
        session.conversationData.pregunta = 
        answerEntity.entity.substring(inicioMas.length, answerEntity.entity.length);
        session.beginDialog('/Preguntas');
        }
        else{
            session.send(answerEntity.entity);
        }
    }
]);
// Para la respuesta por defecto
intents.onDefault([
    (session) => {
        var userName = session.userData.first_name;
        if(userName == undefined){userName ="";}
        session.sendTyping();// Escribiendo ...
                if (session.message.text.indexOf("🏦") != -1 ) {
            session.send("😆");
        }
        else if (session.message.text.indexOf("👍") != -1) {
            session.send("👍");
        }
        else if(session.message.text.indexOf("🍕") != -1){
            var b ='🍕 👍';
            session.send(b +"");
        }
        else {
             var def = session.localizer.gettext(session.preferredLocale(), "Default");
             session.send('Oppss ' + userName + '<br/>' + def);
        }

        session.beginDialog('/Opciones');
    }
]);
// Dialogos
// dialogo de Acerca
// Acerca
bot.dialog('/Opciones', [
    (session) => {
        session.sendTyping();// Escribiendo ...
        var msg = new builder.Message(session)
            .text("Opciones_texto")
            .suggestedActions(
            builder.SuggestedActions.create(
                session, [
                    builder.CardAction.dialogAction(session, 'Menu', '/Menu', "Opciones_Menu1"),
                ]
                )
            );
        session.endDialog(msg);
    }
]).triggerAction({
    matches: /^opciones$/i,
    onSelectAction: (session, args) => {
        // Add the help dialog to the top of the dialog stack   (override the default behavior of replacing the stack)  
        session.beginDialog(args.action, args);
    }
});

bot.dialog('/Preguntas', [
    (session) => {
        var PreguntasImg = session.localizer.gettext(session.preferredLocale(), "PreguntasImg");
        var msgP = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
            new builder.HeroCard(session)
                .title("Preguntas")
                .images([
                builder.CardImage.create(session, PreguntasImg)
                //  builder.CardImage.create(session,'./IMG/uno.png', 'image/png','uno.png')
            ])
        ]);
        session.send(msgP);
        session.beginDialog('/PreguntasFrecuentes');
    }
]);
//PreguntasFrecuentes
bot.dialog('/PreguntasFrecuentes', [
    (session) => {
        var t = 0;
        var PreguntasF = session.conversationData.pregunta.split(',');
        var Frecuencia = 0;
        session.conversationData.pasoM = PreguntasF.length;
        for (t = session.conversationData.paso; (t < PreguntasF.length && Frecuencia < 3); t++) {
            var msg = new builder.Message(session)
                .textFormat(builder.TextFormat.xml)
                .attachments([
                new builder.HeroCard(session)
                    .title(PreguntasF[t])
                    .buttons([builder.CardAction.imBack(
                    session, PreguntasF[t], "(" + (t + 1) + " / " + PreguntasF.length + ") OK")])
            ]);
            session.send(msg);
            Frecuencia++;
        }
        session.conversationData.paso = t;
        if (t >= PreguntasF.length) {
            session.beginDialog('/Opciones');
        }
        else {
            session.beginDialog('/Continuar');
        }
    }
]); 
bot.dialog('/Continuar', [
    (session) => {
        if (session.conversationData.paso <= session.conversationData.pasoM) {
            var msg = new builder.Message(session)
                .text("ContinuarOpcionTexto")
                .suggestedActions(
                builder.SuggestedActions.create(
                    session, [
                        builder.CardAction.dialogAction(session, 'PreguntasFrecuentes', '/PreguntasFrecuentes', "ContinuarOpciones"),
                        builder.CardAction.dialogAction(session, 'Opciones', '/Opciones', "ContinuarOpciones2")
                    ]));
            session.endDialog(msg);
        }
        else {
            session.beginDialog('/Opciones');
        }
    }
]);
bot.dialog('/Ayuda', [
    (session) => {
        var userName = session.userData.first_name;
        if(userName==undefined){userName ="";}
        session.sendTyping();// Escribiendo ...
        var Ayuda_texto = session.localizer.gettext(session.preferredLocale(), 'Greeting') + " " + userName
            + "!<br/>" + session.localizer.gettext(session.preferredLocale(), 'Ayuda');
        session.send(Ayuda_texto);
        session.beginDialog('/Opciones');
    }
]);
bot.dialog('/Acerca', [
    (session) => {
        var userName = session.userData.first_name;
        if(userName==undefined){userName ="";}
        session.sendTyping();// Escribiendo ...
        var AcercaD = session.localizer.gettext(session.preferredLocale(), 'Greeting') + " " + userName
            + "!<br/>" + session.localizer.gettext(session.preferredLocale(), 'About');
        session.send(AcercaD);
        session.send("Citas_uno");
        session.beginDialog('/Opciones');
    }
]).triggerAction({
    matches: /^que.*es.*customerservicebot$|^que.*es.*customerservice$|^customerservicebot$|^customerservice$/i,
    onSelectAction: (session, args, next) => {
        // Add the help dialog to the top of the dialog stack   (override the default behavior of replacing the stack)  
        session.beginDialog(args.action, args);
    }
});
// Fin de acerca
// Dialogos de citas
bot.dialog('/Citas', [
    (session, results, args) => {
        session.sendTyping();// Escribiendo ...
        if (session.userData.citapendiente != 'si') {
            session.beginDialog('/citaDetalles');
        }
        else {
            session.beginDialog('/CitasOpciones');
        }
    }
]);
bot.dialog('/CitasOpciones', [
    (session) => {
        var ImgCita = session.localizer.gettext(session.preferredLocale(), "ImgCita");
        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
            new builder.HeroCard(session)
                .title("CitasOpciones")
            // .subtitle("Como puedo ayudarte?")
            //.text("Presiona un boton!.")
                .images([
                builder.CardImage.create(session, ImgCita)
                //  builder.CardImage.create(session,'./IMG/uno.png', 'image/png','uno.png')
            ])
                .buttons([
                builder.CardAction.dialogAction(session, 'Consultar', '/Consultar', "CitasOpciones_1"),
                builder.CardAction.dialogAction(session, 'citaDetalles', '/citaDetalles', "CitasOpciones_2"),
                builder.CardAction.dialogAction(session, 'Cancelar', '/Cancelar', "CitasOpciones_3"),
                /* builder.CardAction.imBack(session,'(quit)','Salir')*/
                /* builder.CardAction.dialogAction(session,"Despedida",'','Despedida')*/
            ])
        ]);
        //session.endDialog(msg);
        session.send(msg);
        session.beginDialog('/Opciones');
    }
]);
var horas = [
    "8 AM",
    "9 AM",
    "10 AM",
    "11 AM",
    "1 PM",
    "2 PM",
    "3 PM",
];
bot.dialog('/citaDetalles', [
    function (session) {
        builder.Prompts.number(session, "CitasDetallesPersonas");
    },
    function (session, results) {
        session.userData.personas = results.response;
        var departamentos = session.localizer.gettext(session.preferredLocale(), "CitaDetallesDepartamentos");
        builder.Prompts.choice(session, "CitasDetallesDepartamento", departamentos, { listStyle: builder.ListStyle.button });
    },
    function (session, results) {
        session.userData.departamento = results.response.entity;
        // builder.Prompts.time(session, "Para cuando nos visitas?, ejemplo 10 de octubre del 2017 2pm!");
        var fechas = fechaCita();
        builder.Prompts.choice(session, "CitasDetallesFecha", fechas, { listStyle: builder.ListStyle.button });
    },
    function (session, results) {
        session.userData.fecha = results.response.entity;
        //  session.userData.fecha = builder.EntityRecognizer.resolveTime([results.response])
        builder.Prompts.choice(session, "CitasDetalleshora", horas, { listStyle: builder.ListStyle.button });
    },
    function (session, results) {
        //session.userData.fecha = builder.EntityRecognizer.resolveTime([session.userData.fecha + " a las " +results.response.entity]);
        session.userData.hora = results.response.entity;
        session.beginDialog('/Consultar');
    }
]);
function fechaCita() {
    var resp = "";
    for (var i = 1; i <= 9; i++) {
        var hoy = new Date();
        hoy = sumarDias(hoy, i);
        if((hoy.getDay()!=0) && (hoy.getDay()!=6)){
        var dd = hoy.getDate();
        var mm = hoy.getMonth() + 1; //hoy es 0!
        var yyyy = hoy.getFullYear();
        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }
        if (i == 1) {
            resp = dd + '/' + mm + '/' + yyyy;
        }
        else{
             resp += "|" + dd + '/' + mm + '/' + yyyy;
        }
        }
    }
    return resp;
}
function sumarDias(fecha, dias) {
    fecha.setDate(fecha.getDate() + dias);
    return fecha;
}
bot.dialog('/Cancelar', [
    function (session) {
        session.userData.citapendiente = "";
        session.userData.personas = "";
        session.userData.departamento = "";
        session.userData.fecha = "";
        session.send("CancelarCita"); // Opciones
        session.beginDialog('/Opciones');
    }
]);
bot.dialog('/Consultar', [ //Editar
    (session) => { 
        //  session.send(mCitaProgramada);
        var userName = session.userData.first_name;
        if(userName==undefined){userName ="";}  
        var last_name = session.userData.last_name;
        if(last_name==undefined){last_name ="";}   
        var Consultar1 = 
        session.localizer.gettext(session.preferredLocale(), "ConsultarNombre") + userName + " " + last_name +"<br/>"+
        session.localizer.gettext(session.preferredLocale(), "ConsultarPersonas") + session.userData.personas +"<br/>"+
        session.localizer.gettext(session.preferredLocale(), "ConsultarDepartamento") + session.userData.departamento +"<br/>"+
        session.localizer.gettext(session.preferredLocale(), "ConsultarFechaHora")+ session.userData.fecha + " : " + session.userData.hora;
        session.send(Consultar1);
        session.userData.citapendiente = "si";
        session.beginDialog('/Opciones');
    }
]);