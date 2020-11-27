const discord = require('discord.js');
const io = require('socket.io-client');
const rpgDiceRoller = require('rpg-dice-roller/lib/umd/bundle.js');
const axios = require("axios")

const regex = require('./utils/utils');
const configs = require('./configs/configs');

const client = new discord.Client();
const roller = new rpgDiceRoller.DiceRoller();

client.login(configs.discordBotToken)

const socket = io.connect(configs.socket_url, {
    reconnection: true
});

const Roll = require("./modules/roll");
const Attack = require("./modules/attack");
const Save = require("./modules/save");
const Char = require('./modules/char');
const Cast = require('./modules/cast');
const Rest = require('./modules/rest');

const characters = [];
const users = [];
const campaigns = [];
const spells = [];
let selectedCharacters = {};

/**
 * Una vez el bot de Discord inicializa,
 * recupera todos los datos de los ficheros
 */
client.on("ready", () => {
    console.log(`Bot is ready as ${client.user.tag}`);
    get_characters();
    get_users();
    get_campaigns();
    get_spells();

});

/**
 * Actualiza en caliente una vez el socket se ha inicializado
 */
socket.on('connect', function () {
    console.log(`Socket connected to ${configs.socket_url}`);

    socket.on('updatedCharacter', function (data) {
        console.log(`Updated character ${data.id}`);
        setTimeout(() => get_characters(), 1000);
    })

    socket.on('updatedUsers', function (data) {
        console.log(`Updated user ${data.id}`);
        setTimeout(() => get_users(), 1000);
    })

    socket.on('updatedCampaigns', function (data) {
        console.log(`Updated campaign ${data.id}`);
        setTimeout(() => get_campaigns(), 1000);
    })

    socket.on('updatedSpells', function (data) {
        console.log(`Updated spell ${data.id}`);
        setTimeout(() => get_spells(), 1000);
    })
})

/**
 * Inicializa los distintos módulos cuando recibe un mensaje
 */
client.on("message", async message => {
    if (message.content.charAt(0) === "!") {
        let character = selectedCharacters[message.author.id] || await select_character(message);

        // Transforma el input del usuario en una array de parámetros
        const args = message.content
            .replace(regex.removeSpacesAroundOperator, "$1")
            .match(regex.splitParams);

        console.log(args[0])

        switch (args[0]) {
            case "!commands":
                return message.channel.send("**Tirada estándar:** `!roll`\n**Tirada de ataque:** `!atk`\n**Tirada de curación: ** `!heal`\n**Tirada de salvación:** `!save`\n**Tirada de habilidad:** `!skill`");
            case "!roll":
                return Roll.initialize(
                    message,
                    args,
                    character,
                    roller
                );
            case "!attack":
                return Attack.initialize(
                    message,
                    args,
                    character,
                    roller
                );
            case "!save":
                return Save.initialize(
                    message,
                    args,
                    character,
                    roller
                );
            case "!char":
                return Char.initialize(
                    message,
                    args,
                    character,
                    select_user_characters,
                    selectedCharacters,
                    select_character,
                    discord
                )
            case "!cast":
                return Cast.initialize(
                    message,
                    args,
                    character,
                    spells,
                    discord,
                    parse_discord_markdown,
                    roller,
                    send_character
                )
            case "!rest":
                return Rest.initialize(
                    message,
                    args,
                    character,
                    send_character
                )
            default:
                return message.channel.send(":warning: El comando introducido no ha podido ser reconocido. Utiliza `!commands` para obtener un listado de comandos disponibles.`")
        }
    }
});

/**
 * Regresa un token de autorización con permisos de SuperAdmin
 * @returns {String} token
 */
async function user_data() {
    try {
        const url = configs.endpoint_url + 'auth/login'

        const res = await axios.post(url, configs.adminData)
        return res.data.payload.token;
    } catch (e) {
        return null;
    }
}

/**
 * Devuelve una array de todos los personajes disponibles
 * @returns {Array} chars
 */
async function get_characters() {
    const token = await user_data();

    try {
        const url = configs.endpoint_url + "characters";
        const headers = {
            'Authorization': 'Bearer ' + token
        };

        const chars = await axios.get(url, { headers });

        characters.push(...chars.data.payload);

        if (Object.keys(selectedCharacters).length > 0) {
            const users = Object.keys(selectedCharacters);

            users.forEach(user => {
                const char = selectedCharacters[user];

                selectedCharacters[user] = characters.filter(ch => ch._id === char._id)[0];
            })
        }
    } catch (e) {
        console.log(e);
    }
}

/**
 * Devuelve una array de todos los usuarios
 * @returns {Array} users
 */
async function get_users() {
    const token = await user_data();

    try {
        const url = configs.endpoint_url + "auth/users?type=allUsers";
        const headers = {
            'Authorization': 'Bearer ' + token
        };

        const u = await axios.get(url, { headers })

        users.push(...u.data.payload);
    } catch (e) {
        console.log(e)
    }
}

/**
 * Devuelve una array de todas las campañas
 * @returns {Array} campaigns
 */
async function get_campaigns() {
    const token = await user_data();

    try {
        const url = configs.endpoint_url + "campaigns"
        const headers = {
            'Authorization': 'Bearer ' + token
        }

        const camps = await axios.get(url, { headers })

        campaigns.push(...camps.data.payload)
    } catch (error) {
        return null
    }
}

/**
 * Devuelve una array de todos los hechizos
 * @returns {Array} spells
 */
async function get_spells() {
    const token = await user_data();

    try {
        const url = configs.endpoint_url + "spells/?type=allSpells";
        const headers = {
            'Authorization': 'Bearer ' + token
        }

        const response = await axios.post(url, {}, { headers });

        spells.push(...response.data.payload);
    } catch (error) {
        return null
    }
}

/**
 * Devuelve el personaje actual del usuario basándose en el usuario
 * y la campaña.
 * @param {String} message 
 */
async function select_character(message) {
    try {
        const authorId = message.author.id;
        const channelId = message.channel.id;

        const selectedUser = users.filter(user => user.metadata.discordId === authorId);

        const selectedCampaign = campaigns.filter(campaign =>
            campaign.discordData && (campaign.discordData.main === channelId || (campaign.discordData.privadas && campaign.discordData.privadas.includes(channelId))))

        const selectedCharacter = characters
            .filter(character => selectedCampaign[0].characters.includes(character._id))
            .filter(character => character.player === selectedUser[0]._id);

        return selectedCharacter[0];
    } catch (e) {
        return null;
    }
}

/**
 * Devuelve una array de los personajes del usuario
 * @param {String} message 
 */
async function select_user_characters(message) {
    const authorId = message.author.id;

    const selectedUser = users.filter(user => user.metadata.discordId === authorId);

    if (selectedUser.length > 0) {
        const selectedCharacters = characters.filter(char => char.player === selectedUser[0]._id);
        return selectedCharacters;
    } else {
        return [];
    }
}

/**
 * Traduce el Markdown HTML al Markdown propio de Discord.
 * @param {String} string 
 */
function parse_discord_markdown(string) {
    return string
        .replace(/<b>/g, "***")
        .replace(/<\/b>/g, "***")
        .replace(/<i>/g, "*")
        .replace(/<\/i>/g, "*")
        .replace(/<ul>/g, "")
        .replace(/<\/ul>/g, "")
        .replace(/<li>/g, "\n● ")
        .replace(/<\/li>/g, "")
        .replace(/<br\/>/g, "\n")
}

async function send_character(newCharacter) {
    const token = await user_data();

    try {
        const url = configs.endpoint_url + "characters/" + newCharacter._id;
        const headers = {
            'Authorization': 'Bearer ' + token
        }

        axios.put(url, newCharacter, { headers });
    } catch (error) {
        return null
    }
}