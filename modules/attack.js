const regex = require("../utils/utils");

const Attack = {
    /**
     * Inicializa el módulo Attack
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
        if (regex.isDice.test(args[1])) {
            this.handleBaseRoll(message, roller, args[1], args[2], args);
        } else if (args[1].includes('"')) {
            this.handleCustomAttack(character, message, roller, args[1], args[2], args);
        } else if (args[1] === "list") {
            this.sendMessage(message, '`!attack "Nombre de ataque"`: *Hace un ataque basándose en los Ataques disponibles en tu ficha de personaje. Utiliza `!char show` para ver su listado.*\n`!attack XdY`: *Hace un ataque con tirada de dado*');
        } else {
            this.sendMessage(message, ":warning: No se ha podido encontrar el parámetro introducido. Para una lista completa de parámetros introduce `!attack list`.");
        }
    },

    /**
     * Ejecuta una tirada de dados en formato XdY
     * @param {Object} message objeto de mensaje de Discord
     * @param {Object} roller librería de tirada de dados
     * @param {String} attack argumento de tirada en formato XdY
     * @param {String} target objetivo del ataque
     * @param {Array} args array de parámetros introducidos por el usuario
     */
    handleBaseRoll(message, roller, attack, target, args) {
        let str = `Daño causado `;
        let roll;
        const roll1 = roller.roll(attack);
        const roll2 = roller.roll(attack);

        if (target && target !== "advantage" && target !== "disadvantage") {
            const targetName = target
                .match(/(?:"[^"]*"|^[^"]*$)/)[0]
                .replace(/"/g, "")

            str += `a **${targetName}** `
        }

        if (args.includes("advantage")) {
            str += `con desventaja: `;
            roll = `[ ${roll1.total}, ${roll2.total} ] = **${Math.min(roll1.total, roll2.total)}**`;
        } else if (args.includes("disadvantage")) {
            str += `con ventaja: `;
            roll = `[ ${roll1.total}, ${roll2.total} ] = **${Math.max(roll1.total, roll2.total)}**`;
        } else {
            roll = roll1.output;
        }

        this.sendMessage(message, str + roll);
    },

    /**
     * Ejecuta una tirada de daño basada en los ataques disponibles del personaje
     * @param {Object} character objeto de datos del personaje
     * @param {Object} message objeto de mensaje de Discord
     * @param {Object} roller librería de tirada de dados
     * @param {String} attack argumento de tirada en formato XdY
     * @param {String} target objetivo del ataque
     * @param {Array} args array de parámetros introducidos por el usuario
     */
    handleCustomAttack(character, message, roller, attack, target, args) {
        const attacks = character.stats.attacks;

        const parsedAttack = attack
            .match(/(?:"[^"]*"|^[^"]*$)/)[0]
            .replace(/"/g, "");

        const selectedAttack = attacks.filter(attack => attack.name === parsedAttack)[0];

        if (selectedAttack) {
            const str = selectedAttack.description;
            const damage = /\(([^)]+)\)/.exec(str)[1];
            const roll1 = roller.roll(damage);
            const roll2 = roller.roll(damage);

            if (damage) {
                if (args.includes("advantage") || args.includes("disadvantage")) {
                    let roll;
                    let strOutput = `Daño causado con **${attackName}**`;

                    if (args.includes("advantage")) {
                        strOutput += ` con ventaja`;
                        roll = `[ ${roll1.total}, ${roll2.total} ] = **${Math.max(roll1.total, roll2.total)}**`;
                    } else {
                        strOutput += ` con desventaja`;
                        roll = `[ ${roll1.total}, ${roll2.total} ] = **${Math.min(roll1.total, roll2.total)}**`;
                    }

                    if (target) {
                        const targetName = target
                            .match(/(?:"[^"]*"|^[^"]*$)/)[0]
                            .replace(/"/g, "");

                        strOutput += ` a **${targetName}**: `;
                    } else {
                        strOutput += `: `;
                    }

                    this.sendMessage(message, strOutput + roll);
                } else {
                    let strOutput = `Daño causado con **${attackName}**: ${roll.output}`;

                    if (target) {
                        const targetName = target
                            .match(/(?:"[^"]*"|^[^"]*$)/)[0]
                            .replace(/"/g, "");

                        strOutput = `Daño causado a **${targetName}** con **${attackName}**: ${roll1.output}`;
                    }

                    this.sendMessage(message, strOutput);
                }
            }
        } else {
            this.sendMessage(message, ":warning: No hay ningún ataque con este nombre.");
        }
    },

    /**
     * Envía un mensaje al canal de Discord
     * @param {Object} message objeto de mensaje de Discord
     * @param {String} str cadena de texto a enviar
     */
    sendMessage(message, str) {
        message.channel.send(str)
    }
}

module.exports = Attack;