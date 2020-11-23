const regex = require("../utils/utils");

const Save = {
    /**
     * Inicializa el módulo Save
     * @param {Object} message objeto de mensaje de Discord
     * @param {Array} args array de parámetros introducidos por el usuario
     * @param {Object} character objeto de datos del personaje
     * @param {Object} roller librería de tirada de dados
     */
    initialize(
        message,
        args,
        character,
        roller
    ) {
        if (args[1] === "list") {
            this.sendMessage(message, "`!save 1d20+<<modificador>>`: *Haz una tirada de salvación*\n`!save strength`: *Haz una tirada de salvación de Fuerza*\n`!save dexterity`: *Haz una tirada de salvación de Destreza*\n`!save constitution`: *Haz una tirada de salvación de Constitución*\n`!save intelligence`: *Haz una tirada de salvación de Inteligencia*\n`!save wisdom`: *Haz una tirada de salvación de Sabiduría*\n`!save charisma`: *Haz una tirada de salvación de Carisma*");
        } else if (regex.isDice.test(args[1])) {
            this.handleBaseRoll(message, roller, args);
        } else if (character && character.stats.abilityScores.hasOwnProperty(args[1])) {
            this.handleCustomSave(message, character, roller, args);
        } else {
            this.sendMessage(message, ":warning: No se ha podido encontrar el parámetro introducido. Para una lista completa de parámetros introduce `!save list`.");
        }
    },

    /**
     * Ejecuta una tirada de dados en formato XdY
     * @param {Object} message objeto de mensaje de Discord
     * @param {Object} roller libreria de tirada de dados
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
                str = ":x: Fallo en salvacióncon ventaja: ";
                roll = `[ ${roll1.total}, ${roll2.total} ] = **${Math.max(roll1.total, roll2.total)}**`;

                if (dc) {
                    roll += ` <= ${dc}`;
                }
            } else {
                str = ":white_check_mark: Éxito en salvación con ventaja: ";
                roll = `[ ${roll1.total}, ${roll2.total} ] = **${Math.max(roll1.total, roll2.total)}**`;

                if (dc) {
                    roll += ` >= ${dc}`;
                }
            }

            this.sendMessage(message, str + roll);

        } else if (args.includes("disadvantage")) {
            if (Math.min(roll1.total, roll2.total) <= dc) {
                str = ":x: Fallo en salvación con desventaja: ";
                roll = `[ ${roll1.total}, ${roll2.total} ] = **${Math.min(roll1.total, roll2.total)}**`;

                if (dc) {
                    roll += ` <= ${dc}`;
                }
            } else {
                str = ":white_check_mark: Éxito en salvación con ventaja: ";
                roll = `[ ${roll1.total}, ${roll2.total} ] = **${Math.min(roll1.total, roll2.total)}**`;

                if (dc) {
                    roll += ` >= ${dc}`;
                }
            }

            this.sendMessage(message, str + roll);
        } else {
            if (roll1.total >= dc) {
                str = ":white_check_mark: Éxito en salvación: " + roll1.output;

                if (dc) {
                    str += " >= " + dc ;
                }

                this.sendMessage(message, str);
            } else {
                str = ":x: Fallo en salvación: " + roll1.output;

                if (dc) {
                    str += " <= " + dc ;
                }

                this.sendMessage(message, str)
            }
        }
    },

    /**
     * Ejecuta una tirada de dados basada en los datos del personaje
     * @param {Object} message objeto de mensaje de Discord
     * @param {Object} character objeto de datos del personaje
     * @param {Object} roller libreria de tirada de dados
     * @param {Array} args array de parámetros introducidos por el usuario
     */
    handleCustomSave(message, character, roller, args) {
        const abilityScore = character.stats.abilityScores[args[1]];
        const savingThrow = character.stats.savingThrows[args[1]];

        let proficiencyBonus = 0;
        let totalLevel = 0;
        let modifier = Math.floor((abilityScore - 10) / 2);

        character.stats.classes.forEach(charClass => {
            totalLevel += charClass.classLevel;
        });

        proficiencyBonus = Math.ceil(1 + totalLevel / 4);

        if (savingThrow.expertise) {
            modifier = modifier + (proficiencyBonus * 2);
        } else if (savingThrow.proficient) {
            modifier = modifier + proficiencyBonus;
        }

        const roll = roller.roll(`1d20${modifier >= 0 ? '+' : ''}${modifier}`);

        if (regex.hasNumber.test(args[2])) {
            dc = args[2]
        };

        if (dc) {
            if (roll.total >= dc) {
                this.sendMessage(messagee, ":white_check_mark: Éxito: " + roll.output + " >= " + dc);
            } else {
                this.sendMessage(message, ":x: Fallo: " + roll.output + " <= " + dc);
            }
        } else {
            this.sendMessage(message, `Tirada de salvación: ${roll}`);
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

module.exports = Save;