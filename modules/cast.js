const regex = require("../utils/utils");

const Cast = {
    /**
     * Inicializa el módulo Cast
     * @param {Object} message objeto de mensaje de Discord
     * @param {Array} args array de parámetros del personaje
     * @param {Object} character objeto de datos del personaje
     * @param {Array} spells listado de hechizos
     * @param {Object} discord librería de discord.js
     * @param {Function} parse_discord_markdown función de parseado de markdown de discord
     * @param {Object} roller librería de tirada de dados
     * @param {Function} send_character función PUT de actualización de personaje
     */
    initialize(
        message,
        args,
        character,
        spells,
        discord,
        parse_discord_markdown,
        roller,
        send_character
    ) {
        if (args[1] === "show") {
            this.showUserSpells(message, spells, character, discord, args, parse_discord_markdown);
        } else if (args[1].includes('"')) {
            this.castSpell(message, args, args[1].replace(/"/g, ""), spells, character, parse_discord_markdown, roller, send_character);
        } else {
            this.sendMessage(message, ":warning: No se ha podido encontrar el parámetro introducido. Para una lista completa de parámetros introduce `!cast help`.")
        }
    },

    /**
     * Muestra un listado de los hechizos disponibles del personaje
     * @param {Object} message objeto de mensaje de Discord
     * @param {Array} spellList array de hechizos
     * @param {Object} character objeto de datos del personaje
     * @param {Object} discord librería discord.js
     * @param {Array} args array de parámetros del usuario
     * @param {Function} parse_discord_markdown función de parseado de markdown de discord
     */
    showUserSpells(message, spellList, character, discord, args, parse_discord_markdown) {
        if (character.stats.spells) {
            const embed = new discord.MessageEmbed()

            if (args[2] && args[2].includes('"')) {
                const spellIndex = spellList.findIndex(spell => spell.name === args[2].replace(/"/g, ""));

                if (spellIndex > -1) {
                    const selectedSpell = spellList[spellIndex];

                    embed.
                        setTitle(selectedSpell.name)
                        .setDescription((selectedSpell.stats.level > 0 ?
                            `Hechizo de ${selectedSpell.stats.school} de nivel ${selectedSpell.stats.level}` :
                            `Truco de ${selectedSpell.stats.school}`) + `\n\n${parse_discord_markdown(selectedSpell.stats.description)}`)
                        .addFields({
                            name: "Componentes",
                            value: `${selectedSpell.stats.components.type}` + 
                            (selectedSpell.stats.components.description ? `(${selectedSpell.stats.components.description})` : '')
                        })
                        .addFields({
                            name: "Tiempo de lanzamiento",
                            value: selectedSpell.stats.castingTime
                        })
                        .addFields({
                            name: "Duración",
                            value: selectedSpell.stats.duration
                        })

                    if (selectedSpell.stats.range) {
                        embed
                            .addFields({
                                name: "Alcance",
                                value: selectedSpell.stats.range
                            })
                    }

                    if (selectedSpell.stats.attack) {
                        embed
                            .addFields({
                                name: "Ataque",
                                value: selectedSpell.stats.attack
                            })
                    }
                }

            } else {
                const spellIds = character.stats.spells.map(spell => spell.spellId);

                const classString = character.stats.classes.map(charClass => charClass.className + ", " + charClass.classLevel).join("; ")
                const spellListSelected = spellList.filter(spellData => spellIds.findIndex(spellId => spellData._id === spellId) >= -1);

                embed
                    .setTitle(character.flavor.traits.name)
                    .setDescription((character.stats.background && character.stats.background.name) + " " + classString)
                    .setThumbnail(character.flavor.portrait)

                const spellListSelectedMaxLevel = Math.max(...spellListSelected.map(spellSelected => spellSelected.stats.level))

                for (let index = 0; index <= spellListSelectedMaxLevel; index++) {
                    embed
                        .addFields({
                            name: index === "0" ? "Trucos" : "Nivel " + index,
                            value: spellListSelected
                                .filter(spellSelected => spellSelected.stats.level === index)
                                .map(spellSelected => spellSelected.name)
                                .join(", ")
                        })
                }
            }

            this.sendMessage(message, embed)
        } else {
            this.sendMessage(message, ":warning: Este personaje no tiene hechizos disponibles.")
        }
    },

    /**
     * Lanza un hechizo disponible para el personaje
     * @param {Object} message objeto de mensaje de Discord
     * @param {Array} args array de parámetros introducidos por el usuario
     * @param {String} spell nombre del hechizo seleccionado por el usuario
     * @param {Array} spells array de hechizos
     * @param {Object} character objeto de datos del personaje
     * @param {Function} parse_discord_markdown función de parseado de markdown de discord
     * @param {Object} roller librería de tirada de dados
     * @param {Object} character objeto de datos del personaje
     */
    castSpell(message, args, spell, spells, character, parse_discord_markdown, roller, send_character) {
        const spellAttack = (message, args, roller, spell, spellLevel = null) => {
            if (args[3].match(regex.isDice)) {
                const roll = roller.roll(args[3]);
                let str = `Daño causado con **${spell}**`;

                if (args[4].includes('"')) {
                    str += ` a **${args[4].replace(/"/g, "")}**`;
                }

                const spellLvl = spellLevel || spell.stats.level;

                if (spellLvl) {
                    if (spellLvl = 0) {
                        str += ` como Truco`
                    } else if (spellLvl > 0) {
                        str += ` a nivel ${spellLvl}`;
                    }
                }

                str += `: ${roll.output}`;

                this.sendMessage(message, str);
            } else {
                this.sendMessage(message, ":warning: Introduce los dados que quieres lanzar.")
            }
        }

        const spellHeal = (message, args, roller, spell, spellLevel = null) => {
            if (args[3].match(regex.isDice)) {
                const roll = roller.roll(args[3]);
                let str = `Curación causada con **${spell}**`;

                if (args[4].includes('"')) {
                    str += ` a **${args[4].replace(/"/g, "")}**`;
                }

                const spellLvl = spellLevel || spell.stats.level;

                if (spellLvl) {
                    if (spellLvl = 0) {
                        str += ` como Truco`
                    } else if (spellLvl > 0) {
                        str += ` a nivel ${spellLvl}`;
                    }
                }

                str += `: ${roll.output}`;

                this.sendMessage(message, str);

            } else {
                this.sendMessage(message, ":warning: Introduce los dados que quieres lanzar.")
            }
        }

        const useSpellSlot = (spellLevel, character, send_character) => {
            if (character.stats.spellSlots) {
                const newChar = { ...character };
                let slots = parseInt(newChar.stats.spellSlots[spellLevel.toString()]);

                if (slots > 0) {
                    slots--;
                    newChar.stats.spellSlots[spellLevel.toString()] = slots.toString();

                    send_character(newChar);
                }
            }
        }

        if (args[2]) {
            // TODO: Comprobar si el hechizo lanzado está entre los hechizos del personaje
            if (args[2].test(regex.hasNumber)) {
                const spellLevel = args[2];

                if (args[3] === "dmg") {
                    spellAttack(message, args, roller, spell, spellLevel);
                } else if (args[3] === "heal") {
                    spellHeal(message, args, roller, spell, spellLevel)
                }

                useSpellSlot(spellLevel, character, send_character);

            } else {
                if (args[2] === "dmg") {
                    spellAttack(message, args, roller, spell);
                } else if (args[2] === "heal") {
                    spellHeal(message, args, roller, spell)
                }

                useSpellSlot(spellLevel, character, send_character);
            }
        } else {
            const index = spells.findIndex(sp => sp.name === spell);

            const selectedSpell = spells[index];

            const spellStr = `**${character.flavor.traits.name}** lanza el hechizo **${selectedSpell.name}** a nivel **${selectedSpell.stats.level}**`;
            this.sendMessage(message, parse_discord_markdown(spellStr))

            useSpellSlot(selectedSpell.stats.level, character, send_character);

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
};

module.exports = Cast;