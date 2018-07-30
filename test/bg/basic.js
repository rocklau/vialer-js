const fs = require('fs').promises
const util = require('util')

const glob = util.promisify(require('glob'))
const test = require('tape')


require('../../src/js/bg/vendor')
require('../../src/js/i18n/nl')
const {AppBackground, options} = require('../../src/js/bg')


test('[bg] starting up sequence', function(t) {
    t.plan(3)
    const bg = new AppBackground(options)
    console.log(options.modules.builtin)
    // There is no schema in the database on a fresh start.
    t.equal(bg.store.get('schema'), null, 'storage: schema absent on startup')
    bg.on('factory-defaults', () => {
        console.log("FACTORY")
        // The schema is set after a factory reset.
        t.equal(bg.store.get('schema'), bg.store.schema, `storage: schema version (${bg.store.schema}) present after factory reset`)
    })

    // UA status starts as `inactive`. There is a watcher for `store.calls.ua.status`,
    // which adapts the mnubar status accordingly. This check makes sure that the
    // watcher mechanism picks up the change.
    bg.on('ready', () => {
        console.log("READY")
        bg.state.user.authenticated = true
        bg.setState({calls: {ua: {status: 'registered'}}})
        Vue.nextTick(function() {
            t.equal(bg.state.ui.menubar.base, 'disconnected', 'watchers: initialized watchers pick up changes')
        })
    })
})


test('[bg] translations', async function(t) {
    t.plan(3)

    const files = await glob('{src/js/**/*.js,src/components/**/{*.vue,*.js}}')
    const translationMatch = /\$t\([\s]*'([a-zA-Z0-9_\s{}.,\\'!?%\-:;"]+)'[(\),)?]/g
    const unescape = /\\/g
    let missing = []
    let translations = []
    let faultyUppercase = []
    let redundant = []
    for (const filename of files) {
        const data = await (await fs.readFile(filename)).toString('utf8')
        data.replace(translationMatch, function(pattern, $t) {
            $t = $t.replace(unescape, '')
            // All translations must start with lower case.
            if (($t[0] !== $t[0].toLowerCase() && $t[1] !== $t[1].toUpperCase())) faultyUppercase.push($t)
            translations.push($t)
            if (!($t in global.translations.nl)) {
                missing.push($t)
            }
        })
    }

    // Check if we have translations that are not defined; i.e. that are redundant.
    for (const translation of Object.keys(global.translations.nl)) {
        if (!(translations.includes(translation))) {
            redundant.push(translation)
        }
    }

    t.notOk(faultyUppercase.length, 'translations are all lower-case')
    if (faultyUppercase.length) t.comment(`affected translations: \r\n${faultyUppercase.join('\r\n')}`)
    t.notOk(redundant.length, 'no redundant translations')
    if (redundant.length) t.comment(`affected translations: \r\n${redundant.join('\r\n')}`)
    t.notOk(missing.length, 'no missing translations')
    if (missing.length) t.comment(`affected translations: \r\n${missing.join('\r\n')}`)
})
