const Char = {
    /**
     * Inicializa el módulo Char
     * @param {Object} message objeto de mensaje de Discord
     * @param {Array} args array de parámetros introducidos por el usuario
     * @param {Object} character objeto de datos del usuario
     * @param {Function} select_user_characters función para seleccionar los personajes disponibles del usuario
     * @param {Object} selectedCharacters objeto de personajes seleccionados de cada usuario
     * @param {Function} select_character función para seleccionar a un personaje
     * @param {Object} discord librería discord.js
     */
    initialize(
        message,
        args,
        character,
        select_user_characters,
        selectedCharacters,
        select_character,
        discord
    ) {
        if (args[1] === "show") {
            this.showCharacters(message, character, select_character, discord);
        } else if (args[1] === "list") {
            this.listCharacters(message, select_user_characters);
        } else if (args[1] === "select") {
            this.selectCharacters(message, args, select_user_characters, selectedCharacters);
        } else {
            this.sendMessage(message, ":warning: No se ha podido encontrar el parámetro introducido. Para una lista completa de parámetros introduce `!char help`.")
        }
    },

    /**
     * Muestra un embed descriptivo con la información del personaje
     * @param {Object} message objeto de mensaje de Discord
     * @param {Object} char objeto de datos del personaje
     * @param {Function} select_character función de selección de personaje
     * @param {Object} discord librería discord.js
     */
    async showCharacters(message, char, select_character, discord) {
        const character = char || await select_character(message);

        if (character) {
            const classString = character.stats.classes.map(charClass => charClass.className + ", " + charClass.classLevel).join("; ")
            const embed = new discord.MessageEmbed()
                .setTitle(character.flavor.traits.name)
                .setDescription((character.stats.background && character.stats.background.name) + " " + classString)
                .setThumbnail(character.flavor.portrait)

            if (message.content.includes("flavor")) {
                this.sendMessage(message, embed)
            } else if (message.content.includes("bonus actions")) {
                if (character.stats.bonusActions.length > 0) {
                    embed
                        .addFields(character.stats.bonusActions.map(bonusAction => {
                            return {
                                name: bonusAction.name,
                                value: parse_discord_markdown(bonusAction.description)
                            }
                        }))
                }
            } else if (message.content.includes("reactions")) {
                if (character.stats.reactions.length > 0) {
                    embed
                        .addFields(character.stats.reactions.map(reactions => {
                            return {
                                name: reactions.name,
                                value: parse_discord_markdown(reactions.description)
                            }
                        }))
                }
            } else if (message.content.includes("abilities")) {
                if (character.stats.additionalAbilities.length > 0) {
                    embed
                        .addFields(character.stats.additionalAbilities.map(ability => {
                            return {
                                name: ability.name,
                                value: parse_discord_markdown(ability.description)
                            }
                        }))
                }
            } else if (message.content.includes("actions")) {
                if (character.stats.actions.length > 0) {
                    embed
                        .addFields(character.stats.actions.map(action => {
                            return {
                                name: action.name,
                                value: action.description
                            }
                        }))

                }
            } else {
                let proficiencyBonus = 0;
                let totalLevel = 0;

                character.stats.classes.forEach(charClass => {
                    totalLevel += charClass.classLevel;
                })

                proficiencyBonus = Math.ceil(1 + totalLevel / 4)

                const statOptions = ["Fuerza", "Destreza", "Constitución", "Inteligencia", "Sabiduría", "Carisma"];
                const statString = Object.values(character.stats.abilityScores).map((abilityScore, index) => "**" + statOptions[index] + "**: " + abilityScore)
                const saveString = Object.keys(character.stats.abilityScores).map((abilityScore, index) => {
                    const savingThrow = character.stats.savingThrows[abilityScore];
                    let modifier = Math.floor((character.stats.abilityScores[abilityScore] - 10) / 2);

                    if (savingThrow.expertise) {
                        modifier = modifier + (proficiencyBonus * 2);
                    } else if (savingThrow.proficiency) {
                        modifier = modifier + proficiencyBonus;
                    }

                    return "**" + statOptions[index] + "**: " + modifier;
                })
                const attackString = character.stats.attacks.map(attack => "**" + attack.name + "**: " + attack.description);


                embed.addFields(
                    { name: "Armadura", value: character.stats.armorClass },
                    { name: "Estadísticas", value: statString, inline: true },
                    { name: "Salvación", value: saveString, inline: true },
                    { name: "Ataques", value: attackString }
                )

            }
            this.sendMessage(message, embed)
        } else {
            const response = ":warning: Parece que no tienes ningún personaje asociado."
            this.sendMessage(message, response)
        }
    },

    /**
     * Muestra un listado de los personajes disponibles del usuario
     * @param {Object} message objeto de mensaje de Discord
     * @param {Function} select_user_characters función de selección de los personajes del usuario
     */
    async listCharacters(message, select_user_characters){
        const selectedCharacters = await select_user_characters(message);

        const response = selectedCharacters.map(char => char.flavor.traits.name);

        if (response.length > 0) {
            this.sendMessage(message, response.join(", "));
        } else {
            this.sendMessage(message, "No tienes ningún personaje creado.");
        }
    },

    /**
     * Selecciona al personaje seleccionado por el usuario
     * @param {Obect} message objeto de mensaje de Discord
     * @param {Array} args array de parámetros introducidos por el usuario
     * @param {Function} select_user_characters función de selección de los personajes del usuario
     * @param {Object} selectedCharacters objeto de personajes seleccionados de cada usuario
     */
    async selectCharacters(message, args, select_user_characters, selectedCharacters) {
        if (args[2].includes('"')) {
            const charName = args[2]
                .replace(/"/g, "");

            if (charName) {
                const userCharacters = await select_user_characters(message);

                if (userCharacters.findIndex(userChar => userChar.flavor.traits.name === charName) >= 0) {
                    const selectedChar = userCharacters.filter(userChar => userChar.flavor.traits.name === charName)[0];

                    selectedCharacters = {
                        [message.author.id]: selectedChar
                    };

                    this.sendMessage(message, "Se ha seleccionado el personaje: " + selectedCharacters[message.author.id].flavor.traits.name);
                }
            }
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

module.exports = Char;