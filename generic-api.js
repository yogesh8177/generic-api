var db = require('./db'); //Imaginary database....

var methodsList = [];
var paths = [];
var paramsList = [];
var paramsRulesList = [];
var model = null;
var getDBActions = ['find', 'findById', 'update', 'create', 'findByIdAndUpdate'];
var postDBActions = ['find', 'findById', 'update', 'create', 'findByIdAndUpdate'];
var putDBActions = ['create'];

var self = module.exports.Resource = {

	model: (_model) => {
		model = _model;
	},

	methods: (_methodsList) => {
		methodsList = _methodsList;
	},

	/* This just works with level 1 params, for multilevel params, need to think about data structure, will do so in next sitting */
	registerRoutes: (app, _path, _paramsList) => {

		paramsList = _paramsList;
		_paramsList.forEach((param, index) => {
			paths.push(_path + '/:' + param);
		});

		methodsList.forEach((method) => {
			paths.forEach((path) => {
				app[method](path, self.requestHandler);
			})
		});
		return paths;
	},

	validateRulesListMisMatch: (_paramsRulesList) => {

		var errors = [];

		/* Fist check if parameters list matches rules list */
		for(var param in _paramsRulesList){
			if(_paramsRulesList.hasOwnProperty(param)){
				if((paramsList.indexOf(param) === -1)){
					errors.push("Parameter "+ param +" does not exist in the parameter list");
					break;
				}
			}
		}

		return errors;
	},
	
	validateParams: (params) => {
		var errors = [];

		for(var param in params){
			var rules = paramsRulesList[param].rules; // change access method depending upon datat structure of paramsRulesList

			rules.forEach((rule) => {
				var ruleError = ruleValidation(rule, param);
				if(ruleError !== ''){
					errors.push(ruleError);
				}
			});			
		}		
	},

	requestHandler: (req, res, next) => {
		/* Here we can do params validtion based on paramsRulesList object */
		if(req.params){
			/* Before validating actual params, validate whether params and rules already exist by  using validateRulesListMisMatch function */
			var misMatchErrors = self.validateRulesListMisMatch(paramsRulesList);
			if(errors.length > 0){
				/* Rules and params mismatch happened */
				return res.json(errors);
			}

			var paramsRulesErrors = self.validateParams(req.params);
			if(paramsRulesErrors.length > 0){
				return res.json(paramsRulesErrors);
			}

			/* If parameter vaidation passes, do something below  like db access*/
			var action = '';
			switch(req.method.toLowerCase()){
				case 'get':
					action = getDBActions[req.body.action]; /* req.body.action will be integer value */
				break;

				case 'post':
					action = postDBActions[req.body.action];
				break;

				case 'put':
					action = putDBActions[req.body.action];
				break;
			}

			/* Do Database calls, this logic needs more deep thinking, will do it in the next sitting*/

		}
	},

}

/* validate param here using regex or any other methods */
function ruleValidation(rule, param){

	var error = '';
	var ruleName = rule.name;

	switch(ruleName){
		case 'length':

		break;

		case 'type':

		break;

		default:

		break;
	}

	return error;
}



/* Data Structures

_paramsList = ['id', 'name', 'age'];

_paramsRulesList = {
	param1: "rule",
	param2: "rule",
	param_n: "rule_n"
};

*/