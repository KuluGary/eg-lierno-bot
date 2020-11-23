const regex = require("../utils/utils");

const Roll = {
    /**
     * Inicializa el módulo Roll
     * @param {Object} message objeto de mensaje de Discord
     * @param {Array} args array de parámetros introducidos por el usuario
     * @param {Object} character objeto de datos del personaje
     * @param {Object} roller librería de tiradas de dado
     */
    initialize(
        message,
        args,
        character,
        roller
    ) {
        if (args[1] === "initiative") {
            this.handleInitiative(character, message, roller);
        } else if (regex.isDice.test(args[1])) {
            this.handleBaseRoll(message, roller, args);
        } else if (args[1] === "list") {
            this.sendMessage(message, "`!roll initiative`: *Calcula iniciativa basándose en tu personaje actual.*\n`!roll XdY`: *Hace una tirada de dado*");
        } else {
            this.sendMessage(message, ":warning: No se ha podido encontrar el parámetro introducido. Para una lista completa de parámetros introduce `!roll list`.");
        }
    },

    /**
     * Ejecuta una tirada de dados de iniciativa
     * @param {Object} character objeto de datos del personaje
     * @param {Object} message objeto de mensaje de Discord
     * @param {Object} roller librería de tiradas de dado
     */
    handleInitiative(character, message, roller) {
        const initiativeBonus = character.stats.initiativeBonus;
        let roll;
        let str = `Tirada de iniciativa: `;
        const roll1 = roller.roll(`1d20${initiativeBonus >= 0 ? '+' : ''}${initiativeBonus}`);
        const roll2 = roller.roll(`1d20${initiativeBonus >= 0 ? '+' : ''}${initiativeBonus}`);

        if (message.content.includes("disadvantage")) {
            str = `Tirada de iniciativa con desventaja: `;

            roll = `[ ${roll1.total}, ${roll2.total} ] = **${Math.min(roll1.total, roll2.total)}**`;

        } else if (message.content.includes("advantage")) {
            str = `Tirada de iniciativa con ventaja: `;

            roll = `[ ${roll1.total}, ${roll2.total} ] = **${Math.max(roll1.total, roll2.total)}**`;
        } else {
            roll = roll1.output;
        }

        this.sendMessage(message, str + roll);
    },

    /**
     * Ejecuta una tirada de dados en formato XdY
     * @param {Object} message objeto de mensaje de Discord
     * @param {Object} roller librería de tiradas de dado
     * @param {Array} args array de parámetros introducidos por el usuario
     */
    handleBaseRoll(message, roller, args) {
        let str;
        let roll;
        let dc;

        const roll1 = roller.roll(args[1]);
        const roll2 = roller.roll(args[1]);

        if (regex.hasNumber.test(args[2])) {
            dc = args[2]
        };

        if (args.includes("advantage")) {
            if (Math.max(roll1.total, roll2.total) <= dc) {
                str = ":x: Fallo: ";
                roll = `[ ${roll1.total}, ${roll2.total} ] = **${Math.max(roll1.total, roll2.total)}**`;

                if (dc) {
                    roll += ` <= ${dc}`;
                }
            } else {
                str = ":white_check_mark: Éxito con ventaja: ";
                roll = `[ ${roll1.total}, ${roll2.total} ] = **${Math.max(roll1.total, roll2.total)}**`;

                if (dc) {
                    roll += ` >= ${dc}`;
                }
            }

            this.sendMessage(message, str + roll);

        } else if (args.includes("disadvantage")) {
            if (Math.min(roll1.total, roll2.total) <= dc) {
                str = ":x: Fallo: ";
                roll = `[ ${roll1.total}, ${roll2.total} ] = **${Math.min(roll1.total, roll2.total)}**`;

                if (dc) {
                    roll += ` <= ${dc}`;
                }
            } else {
                str = ":white_check_mark: Éxito con ventaja: ";
                roll = `[ ${roll1.total}, ${roll2.total} ] = **${Math.min(roll1.total, roll2.total)}**`;

                if (dc) {
                    roll += ` >= ${dc}`;
                }
            }

            this.sendMessage(message, str + roll);
        } else {
            if (roll1.total >= dc) {
                this.sendMessage(message, ":white_check_mark: Éxito: " + roll1.output + " >= " + dc);
            } else {
                this.sendMessage(message, ":x: Fallo: " + roll1.output + " <= " + dc)
            }
        }
    },

    /**
     * Envía un mensaje al canal de Discord
     * @param {Object} message objeto de mensaje de Discord
     * @param {String} str cadena de texto a enviar
     */
    sendMessage(message, str) {
        message.channel.send(str);
    }
}

module.exports = Roll;