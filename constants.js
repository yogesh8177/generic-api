module.exports = {
	PAGE_SIZE: 10,
	DEMO_CONFIG: {
		model: 'User',
		enableModifiers: true,
		modifierRules: {slug: ['slugify','uppercase']},
		methods: ['get', 'post', 'put'],
		path: '/user',
		paramsArray: ['_id', 'email', 'name'],
		paramsRulesList: {
							name: {
								rules: [{name: 'length', max: 3, min: 1}]
							},
							email: {
								rules: [{name: 'email'}]
							}
						}
	}
}