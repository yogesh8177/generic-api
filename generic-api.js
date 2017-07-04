var db = require('./db'); //Imaginary database....
var constants = require('./constants');
var mongoose = require('mongoose');

var methodsList = [];
var paths = [];
var paramsList = [];
var paramsRulesList = {};
var model = null;
// var getDBActions = ['find', 'findById', 'update', 'create', 'findByIdAndUpdate'];
// var postDBActions = ['find', 'findById', 'update', 'create', 'findByIdAndUpdate'];
// var putDBActions = ['create'];

var self = module.exports.Resource = {

	/* Text name of the model: @_model */
	model: (_model) => {
		model = _model;
	},

	methods: (_methodsList) => {
		methodsList = _methodsList;
	},

	setParamRulesList: (list) => {
		paramsRulesList = list;
	},

	/* This just works with level 1 params, for multilevel params, need to think about data structure, will do so in next sitting */
	registerRoutes: (app, _path, _paramsList) => {

		paramsList = _paramsList;
		/*paths.push(_path); // Add default path
		_paramsList.forEach((param, index) => {
			paths.push(_path + '/' + param + '/:' + param);
		});*/

		methodsList.forEach((method) => {
			//for(var i = 0; i < paths.length; i++){
				app[method](_path, self.requestHandler);
				console.log(_path + '    <--- ' + method);
				//if(method === 'put') // We want default route for put, thus we break after it
				//	break;
				
			//}
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
		return errors;	
	},

	requestHandler: (req, res, next) => {
		/* Here we can do params validation based on paramsRulesList object */
		//return res.json(req.url);
		/* need  to clean below section */
		req.page = req.query.page;
		req.sort = req.query.sort;
		delete req.query.page;
		delete req.query.sort;
		if(Object.keys(req.query).length !== 0){			
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
			error = param.length > rule.max ? param +'length exceeds its limit of '+ rule.max : '';
			error = param.length < rule.min ? param +'length must be atleast '+rule.min : '';
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
			if(misMatchErrors.length > 0){
				/* Rules and params mismatch happened */
				return res.json(misMatchErrors);
			}

			var paramsRulesErrors = self.validateParams(req.params);
			if(paramsRulesErrors.length > 0){
				return res.json(paramsRulesErrors);
			}

			/* If parameter vaidation passes, do something below  like db access*/
			var args = {};
			args.operator = req.query.operator;
			args.page = req.query.page;
			delete req.query.page;
			delete req.query['operator']; // Have to do this as everything is being handled by querystring
			args.params = req.query;
			args.body = req.body;

			switch(req.method.toLowerCase()){
				case 'get':
					console.log('GET query with params');
					getWithParams(args, req.app.db, (err, success) => {
						if(err)
							return next(err);
						return res.json(success);
					});
				break;

				case 'post':
					console.log('POST query with params');
					updateWithParams(args, req.app.db, (err, success) => {
						if(err)
							return next(err);
						return res.json(success);
					});
				break;

				case 'put':
					//action = putDBActions[req.body.action];
				break;

				default:

				break;
			}
}

function requestHandlerWithoutQueryParams(req, res, next){

	var args = {};
	args.body = req.body;
	args.page = req.body.page || req.page;
	args.sortBy = req.body.sort || req.sort;

	switch(req.method.toLowerCase()){

		case 'get':
			console.log('GET query without params');
			getWithoutParams(args, req.app.db, (err, success) => {
				if(err)
					return next(err);
				return res.json(success);
			});
		break;

		case 'put':
			console.log('PUT query without params');
			createResource(args, req.app.db, (err, success) => {
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

/* GET calls for resource with pagination */
function getWithoutParams(args, db, callback){
	var page = args.page || 0; 
	var sortBy = args.sortBy || 'createdAt';
	/* Use sort for performance gains in this query */
	db[model].find({}).sort(sortBy).skip(page * constants.PAGE_SIZE).limit(constants.PAGE_SIZE).exec((err, result) => {
		if(err)
			return callback(err);
		return callback(null, result);
	});
}

// This function is called when there is already atleast single key in object
function getWithParams(args, db, callback){

	var query = createQuery(args.params, args.operator);
	var call = Object.keys(args.params).length > 1 ? 'find' : 'findOne';
	var page = args.page || 0;

	db[model][call](query, (err, success) => {
		if(err)
			return callback(err);
		callback(null, success);
	});
	console.log('Query with params: '+ JSON.stringify(query));
}

// call update query on post method matching req.params
function updateWithParams(args, db, callback){
	var query = createQuery(args.params, args.operator);
	db[model].update(query, args.body, (err, success) => {
		if(err)
			return callback(err);
		callback(null, success);
	});
}

// Create a new resource on PUT request!
function createResource(args, db, callback){

	var resource = args.body || {};
	console.log(resource);
	db[model].create(resource, (err, success) => {
		if(err)
			return callback(err);
		callback(null, success);
	});
}

// function to delete resource
function deleteResource(args, db, callback){

	var query = createQuery(args.params, args.operator);
	db[model].deleteMany(query, (err, success) => {
		if(err)
			return callback(err);
		return callback(null, success);
	});
}

function createQuery(params, operator){

	/* If we have more than one param*/
	var query = {};
	var totalKeys = Object.keys(params).length;
	console.log(params);
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
				console.log(operator);
			break;
		}
	}else{
		// For only single key
		for(var key in params){
			if(key === '_id'){
				query[key] = new mongoose.mongo.ObjectId(params[key]);
			}else{
				query[key] = params[key];
			}
		}
		
	}
	return query;
	console.log(JSON.stringify(query));
}



/* Data Structures

_paramsList = ['id', 'name', 'age'];

_paramsRulesList = {
	param1: "rule",
	param2: "rule",
	param_n: "rule_n"
};

*/