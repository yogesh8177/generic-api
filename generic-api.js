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
			var rules = paramsRulesList[param].rules; // change access method depending upon data structure of paramsRulesList

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
			requestHandlerWithQueryParams(req, res, next);
		}else{
			requestHandlerWithoutQueryParams(req, res, next);
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

function requestHandlerWithQueryParams(req, res, next){
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
			var args = {};
			switch(req.method.toLowerCase()){
				case 'get':
					args.params = req.params;
					getWithParams(args, db, (err, success) => {
						if(err)
							return next(err);
						return res.json(success);
					});
				break;

				case 'post':
					updateWithParams(args, db, (err, success) => {
						if(err)
							return next(err);
						return res.json(success);
					});
				break;

				case 'put':
					//action = putDBActions[req.body.action];
				break;
			}
}

function requestHandlerWithoutQueryParams(req, res, next){

	var args = {};
	args.body = req.body;

	switch(req.method.toLowerCase()){
		case 'put':
			createResource(args, db, (err, success) => {
				if(err)
					return next(err);
				return res.json(success);
			});
		break;

		default:

		break;
	}
}

/* Database calls */

function getWithoutParams(args, db, callback){
	
}

// This function is called when there is already atleast single key in object
function getWithParams(args, db, callback){
	var query = createQuery(args.params);
	var call = Object.keys(args.params).length > 1 ? 'find' : 'findOne';
	db[model][call](query, (err, success) => {
		if(err)
			return callback(err);
		callback(null, success);
	});
	connsole.log(query);
}

// call update query on post method matching req.params
function updateWithParams(args, db, callback){
	var query = createQuery(args.params);
	db[model].update(query, (err, success) => {
		if(err)
			return callback(err);
		callback(null, success);
	});
}

// Create a new resource on PUT request!
function createResource(args, db, callback){

	var resource = args.body || {};
	db[model].create(resource, (err, success) => {
		if(err)
			return callback(err);
		callback(null, success);
	})
}

function createQuery(params, operator){

	/* If we have more than one param*/
	var query = {};
	var totalKeys = Object.keys(params).length;

	if(totalKeys > 1){	
		switch(operator){
			case 'and':
				/* create query object for and operator */
				query['$and'] = [];
				for(var key in params){
					query['$and'].push({[key] : params[key]});
				}

			break;

			case 'or':
				query['$or'] = [];
				for(var key in params){
					query['$or'].push({[key] : params[key]});
				}
			break;

			default:

			break;
		}
	}else{
		// For only single key
		for(var key in params){
			query[key] = params[key];
		}
		
	}
	return query;
	console.log(query);
}



/* Data Structures

_paramsList = ['id', 'name', 'age'];

_paramsRulesList = {
	param1: "rule",
	param2: "rule",
	param_n: "rule_n"
};

*/