const caster = {
    "1": {
        "spellSlots": [2]
    },
    "2": {
        "spellSlots": [3]
    },
    "3": {
        "spellSlots": [4, 2]
    },
    "4": {
        "spellSlots": [4, 3]
    },
    "5": {
        "spellSlots": [4, 3, 2]
    },
    "6": {
        "spellSlots": [4, 3, 3]
    },
    "7": {
        "spellSlots": [4, 3, 3, 1]
    },
    "8": {
        "spellSlots": [4, 3, 3, 2]
    },
    "9": {
        "spellSlots": [4, 3, 3, 3, 1]
    },
    "10": {
        "spellSlots": [4, 3, 3, 3, 2]
    },
    "11": {
        "spellSlots": [4, 3, 3, 3, 2, 1]
    },
    "12": {
        "spellSlots": [4, 3, 3, 3, 2, 1]
    },
    "13": {
        "spellSlots": [4, 3, 3, 3, 2, 1, 1]
    },
    "14": {
        "spellSlots": [4, 3, 3, 3, 2, 1, 1]
    },
    "15": {
        "spellSlots": [4, 3, 3, 3, 2, 1, 1, 1]
    },
    "16": {
        "spellSlots": [4, 3, 3, 3, 2, 1, 1, 1]
    },
    "17": {
        "spellSlots": [4, 3, 3, 3, 2, 1, 1, 1, 1]
    },
    "18": {
        "spellSlots": [4, 3, 3, 3, 2, 1, 1, 1, 1]
    },
    "19": {
        "spellSlots": [4, 3, 3, 3, 2, 1, 1, 1, 1]
    },
    "20": {
        "spellSlots": [4, 3, 3, 3, 2, 1, 1, 1, 1]
    }
}

const Rest = {
    /**
     * Inicializa el módulo Rest
     * @param {Object} message objeto de mensaje de Discord
     * @param {Array} args array de parámetros del personaje
     * @param {Object} character objeto de datos del personaje
     * @param {Function} send_character función PUT de actualización de personaje
     */
    initialize(
        message,
        args,
        character,
        send_character
    ) {
        console.log(args[1])
        if (args[1] === 'long') {
            this.longRest(message, character, send_character);
        }
    },

    /**
     * 
     * @param {Object} message objeto de mensaje de Discord
     * @param {Object} character objeto de datos del personaje
     * @param {Function} send_character función PUT de actualización de personaje
     */
    longRest(message, character, send_character) {
        const calculateMaxSpellSlots = (character, spellLevel) => {
            let classLevel = 0;
            const casterType = {
                fullcaster: ["Druida", "Bardo", "Clérigo", "Mago", "Hechicero", "Brujo"],
                halfcaster: ["Paladín", "Explorador"]
            }

            character.stats.classes.forEach(charClass => {
                if (casterType.fullcaster.includes(charClass.className)) {
                    classLevel += charClass.classLevel;
                } else if (casterType.halfcaster.includes(charClass.className)) {
                    classLevel += Math.floor(charClass.classLevel / 2);
                } else {
                    classLevel += Math.floor(charClass.classLevel / 3)
                }
            })

            return caster[classLevel].spellSlots[parseInt(spellLevel - 1)];
        }

        if (character) {
            let modified = false;

            const newCharacter = { ...character };

            if (character.stats.spellSlots) {

                Object.keys(character.stats.spellSlots).forEach(slot => {
                    console.log(slot)
                    const maxLevel = calculateMaxSpellSlots(character, slot);
                    console.log(maxLevel);

                    newCharacter.stats.spellSlots[slot] = maxLevel.toString();
                })

                modified = true;
            }
            
            if (modified) {
                send_character(newCharacter)
                this.sendMessage(message, `**${newCharacter.flavor.traits.name}** ha llevado a cabo un descanso largo.`)
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

module.exports = Rest;