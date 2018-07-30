module.exports = (app) => {
    // Initialize sub-components for the wizard.
    // TODO: Allow dynamic loading from modules.
    const shared = function() {
        return {
            methods: {
                finishWizard: function() {
                    app.setState({settings: {wizard: {completed: true}}}, {persist: true})
                    app.notify({icon: 'settings', message: this.$t('all set! We hope you enjoy the {name}.', {name: this.app.name}), type: 'info'})
                },
                stepBack: function() {
                    const stepIndex = this.options.findIndex((option) => option.name === this.selected.name)
                    app.setState({settings: {wizard: {steps: {selected: this.options[stepIndex - 1]}}}}, {persist: true})
                },
                stepNext: function() {
                    const stepIndex = this.options.findIndex((option) => option.name === this.selected.name)
                    app.setState({settings: {wizard: {steps: {selected: this.options[stepIndex + 1]}}}}, {persist: true})
                },
            },
        }
    }

    app.components.WizardStepAccount = Vue.component('WizardStepAccount', require('./components/step_account')(app, shared))
    app.components.WizardStepDevices = Vue.component('WizardStepDevices', require('./components/step_devices')(app, shared))
    app.components.WizardStepMicPermission = Vue.component('WizardStepMicPermission', require('./components/step_mic_permission')(app, shared))
    app.components.WizardStepTelemetry = Vue.component('WizardStepTelemetry', require('./components/step_telemetry')(app, shared))
    app.components.WizardStepWelcome = Vue.component('WizardStepWelcome', require('./components/step_welcome')(app, shared))
    /**
    * @memberof fg.components
    */
    const Wizard = {
        computed: app.helpers.sharedComputed(),
        created: function() {
            if (!this.user.platform.account.selection) {
                app.setState({
                    settings: {
                        webrtc: {enabled: true, toggle: true},
                        wizard: {steps: {options: this.steps.options.filter((step) => step.name !== 'WizardStepAccount')}},
                    },
                }, {persist: true})
            }
        },
        render: templates.wizard.r,
        staticRenderFns: templates.wizard.s,
        store: {
            app: 'app',
            settings: 'settings',
            steps: 'settings.wizard.steps',
            user: 'user',
        },
    }

    return Wizard
}
