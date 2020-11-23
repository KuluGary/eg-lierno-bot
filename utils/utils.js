const regex = {
    hasNumber: /\d/,
    isDice: /\dd\d+/,
    splitParams: /(?:[^\s"]+|"[^"]*")+/g,
    removeSpacesAroundOperator: /\s([=+]|[=-])\s/g
}

module.exports = regex;