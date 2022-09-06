var express = require('express'); //Ensure our express framework has been added
var app = express();
var bodyParser = require('body-parser'); //Ensure our body-parser tool has been added
app.use(bodyParser.json());              // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
const axios = require('axios');
const {contentDisposition} = require("express/lib/utils");

//Create Database Connection
var pgp = require('pg-promise')();

const dbConfig = {
	host: 'db',
	port: 5432,
	database: 'ingredients',
	user: 'postgres',
	password: 'pwd'
};
var db = pgp(dbConfig);

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/'));//This line is necessary for us to use relative paths and access our resources directory

// home page
app.get('/PantryChef', function (req, res) {
	var userID_query = 'SELECT account_id FROM currentuser;';
	db.any(userID_query)
	.then(function (userId) {
		var userID = userId[0].account_id;
		res.render('pages/home', {
			my_title: "Home",
			error: "",
			userID: userID
		});
	})
	.catch(function (err) {
		console.log("Issue with getting current userID: ", err);
		return;
	});	
});

app.post('/PantryChef/login', function(req, res) {
	var username = req.body.username;
	var pwd = req.body.password;
	var userID_query = 'SELECT account_id FROM currentuser;';
	var loginValid_query = `SELECT account_id FROM accounts where (username = '${username}' AND password='${pwd}');`;
	db.task('get-everything', task => {
		return task.batch([
			task.any(userID_query),
			task.any(loginValid_query)
		]);
	})
	.then(function (data) {
		var userID = data[0][0].account_id;
		if (data[1] == "") {
			res.render('pages/home', {
				my_title: "Home",
				error: "Invalid Login",
				userID: userID
			});
		}
		else {
			var newID = data[1][0].account_id;
			var changeCurrentUser_query = `UPDATE currentuser SET account_id = ${newID};`
			db.any(changeCurrentUser_query)
			.then(function (data) {
				console.log("Logged in ", username);
				res.render('pages/home', {
					my_title: "Home",
					error: "",
					userID: newID
				});
			})
			.catch(function (err) {
				console.log("Issue with setting current userID: ", err);
				return;
			});
		}		
	})
	.catch(function (err) {
		console.log("Issue with getting current userID: ", err);
		return;
	});	
});

app.post('/PantryChef/logout', function(req, res) {
	var changeCurrentUser_query = `UPDATE currentuser SET account_id = 1;`
	var userID_query = 'SELECT account_id FROM currentuser;';
	db.task('get-everything', task => {
		return task.batch([
			task.any(changeCurrentUser_query),
			task.any(userID_query)
		]);
	})
	.then(function (data) {
		var userID = data[1][0].account_id;
		res.render('pages/home', {
			my_title: "Home",
			error: "",
			userID: userID
		});		
	})
	.catch(function (err) {
		console.log("Issue with logging out current user: ", err);
		return;
	});	
});

app.post('/PantryChef/signup', function(req, res) {
	var username = req.body.username;
	var pwd = req.body.password;
	var userID_query = 'SELECT account_id FROM currentuser;';
	var userExists_query = `SELECT account_id FROM accounts WHERE username = '${username}';`;
	db.task('get-everything', task => {
		return task.batch([
			task.any(userExists_query),
			task.any(userID_query)
		]);
	})
	.then(function (data) {
		var userID = data[1][0].account_id;
		// console.log("USERID: ", data[1]);
		if (data[0] == "") {
			var newaccount_query = `INSERT INTO accounts(username, password, notify_settings, pantry) VALUES ('${username}', '${pwd}', ARRAY [TRUE, TRUE, TRUE, TRUE], ARRAY []::INT[]);`;
			var accountID_querry = `SELECT account_id FROM accounts WHERE username = '${username}';`;
			db.task('get-everything', task => {
				return task.batch([
					task.any(newaccount_query),
					task.any(accountID_querry)
				]);
			})
			.then(function (newData) {
				var newID = newData[1][0].account_id;
				var changeCurrentUser_query = `UPDATE currentuser SET account_id = ${newID};`
				db.any(changeCurrentUser_query)
				.then(function (data) {
					console.log("Logged in ", username);
					res.render('pages/home', {
						my_title: "Home",
						error: "",
						userID: newID
					});
				})
				.catch(function (err) {
					console.log("Issue with setting current userID: ", err);
					return;
				});
			})
			.catch(function (err) {
				console.log("Issue with creating new user: ", err);
				return;
			});
		}
		else {
			res.render('pages/home', {
				my_title: "Home",
				error: "Username unavailable",
				userID: userID
			});	
		}
			
	})
	.catch(function (err) {
		console.log("Issue with creating new user: ", err);
		return;
	});	
});

// searchRecipe page
app.get('/PantryChef/searchRecipe', function(req, res) {
	var userID_query = 'SELECT account_id FROM currentuser;';
	db.any(userID_query)
	.then(function (userId) {
		var userID = userId[0].account_id;
		res.render('pages/searchRecipe', {
			my_title: "Search Recipes",
			apiData: '',
			dbData: '',
			userID: userID,
			error: ""
		});
	})
	.catch(function (err) {
		console.log("Issue with getting current userID: ", err);
		return;
	});	
});


// search Recipe
app.post('/PantryChef/searchRecipe', function (req, res) {
	var userID_query = 'SELECT account_id FROM currentuser;';
	db.any(userID_query)
	.then(function (userId) 
	{
	
	var userID = userId[0].account_id;
	const search_key = req.body.search;
	console.log(search_key);
	var dbrecipes = "SELECT * FROM recipes WHERE name ~* '" + search_key + "'" + ";";
	if (search_key) {
		db.task('get-everything', task => {
			return task.batch([
				task.any(dbrecipes)
			]);
		}).then(info => {
			axios({
				url: `https://api.spoonacular.com/recipes/complexSearch?query=${search_key}&apiKey=e479e1aa6bfd4450a6a7cfbe9116f735`,
				method: 'GET',
				dataType: 'json',
			})
				.then(items => {
					res.render('pages/searchRecipe', {
						apiData: items.data.results,
						dbData: info[0],
						my_title: "Search Recipes",
						userID: userID,
						error: ""
					});
				})
				.catch(error => {
					console.log(error);
					res.render('pages/searchRecipe', {
						apiData: '',
						dbData: '',
						my_title: "Display Recipes",
						userID: userID,
						error: ""
					});
				})
		}).catch(err => {
			res.render('pages/searchRecipe', {
				apiData: '',
				dbData: '',
				my_title: "Display Recipes",
				userID: userID
			});
		});
	}

	})
	.catch(function (err) {
		console.log("Issue with getting current userID: ", err);
		return;
	});
});

// search Recipe
app.get('/PantryChef/searchByIngredients', function (req, res) {
	var userID_query = 'SELECT account_id FROM currentuser;';
	db.any(userID_query)
	.then(function (userId) 
	{
	var userID = userId[0].account_id;
	var getPantry_query = `SELECT pantry FROM "accounts" WHERE account_ID = ${userID};`;
	db.any(getPantry_query)
		.then(function (data) {
			let pantry = data[0].pantry;
			let idFormat = '(';
			for (var i = 0; i < pantry.length - 1; i++) {
				idFormat += pantry[i] + ', ';
			}
			idFormat += pantry[pantry.length - 1] + ')';
			var ingredients_query = `SELECT name FROM ingredients WHERE ingredient_id IN ` + idFormat + `;`;
			db.any(ingredients_query) //find names of each ingredient
				.then(function (info) {
					ingredients_string = '';
					info.forEach(function (ingredient){
						if(ingredients_string == ''){
							ingredients_string = ingredient.name;
						}else {
							ingredients_string += ',+' + ingredient.name;
						}

					})
						axios({
							url: `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredients_string}&apiKey=e479e1aa6bfd4450a6a7cfbe9116f735`,
							method: 'GET',
							dataType: 'json',
						})
							.then(items => {
								//console.log(items)
								res.render('pages/searchRecipe', {
									apiData: items.data,
									dbData: '',
									my_title: "Search Recipes",
									userID: userID,
									error: ""
								});
							})
							.catch(error => {
								console.log(error);
								res.render('pages/searchRecipe', {
									apiData: '',
									dbData: '',
									my_title: "Display Recipes",
									userID: userID,
									error: ""
								});
							});
				})
				.catch(function (err) {
						console.log('error', err);
						res.render('pages/searchRecipe', {
							my_title: "Search Recipe",
							apiData: '',
							dbData: '',
							userID: userID,
							error: ""
						});
				})
		})
		.catch(function (err) {
			console.log('error', err);
			res.render('pages/searchRecipe', {
				my_title: "Search Recipe",
				apiData: '',
				dbData: '',
				userID: userID,
				error: ""
			});
		})
	})
	.catch(function (err) {
		console.log("Issue with getting current userID: ", err);
		return;
	});	
});

// pantry page
app.get('/PantryChef/pantry', function (req, res) {
	var userID_query = 'SELECT account_id FROM currentuser;';
	db.any(userID_query)
	.then(function (userId) {
		var userID = userId[0].account_id;
		finalPantryItems(res, userID);
	})
	.catch(function (err) {
		console.log("Issue with getting current userID: ", err);
		return;
	});	
});

app.post('/PantryChef/pantry/add', function (req, res) {
	var userID_query = 'SELECT account_id FROM currentuser;';
	db.any(userID_query)
	.then(function (userId) 
	{
	var userID = userId[0].account_id;
	var addItem = req.body.pantry_item;


	if (addItem == "") { //check if item exists
		console.log("Error: Must submit an item");
		finalPantryItems(res, userID);
		return;
	}
	addItem = addItem[0].toUpperCase() + (addItem.slice(1)).toLowerCase();
	console.log("Item being added: ", addItem);

	var getPantry_query = `SELECT pantry FROM accounts WHERE account_ID = ${userID};`;
	var getItemId_query = `SELECT ingredient_id FROM ingredients WHERE name = '${addItem}';`
	var pantry;
	//get pantry
	db.task('get-everything', task => {
		return task.batch([
			task.any(getPantry_query),
			task.any(getItemId_query)
		]);
	})
		.then(function (information) {
			pantry = information[0][0].pantry;
			if (information[1][0] == undefined) { //if item isn't in ingredients, add it
				var addIngredient_query = `INSERT INTO ingredients (name) VALUES ('${addItem}');`;
				var getId_query = ` SELECT ingredient_id FROM ingredients WHERE name = '${addItem}';`;
				db.task('get-everything', task => {
					return task.batch([
						task.any(addIngredient_query),
						task.any(getId_query)
					]);
				})
					.then(function (itemInfo) {
						pantry.push(itemInfo[1][0].ingredient_id);
						var insert_query = `UPDATE accounts SET pantry = '{${pantry}}' WHERE account_ID = ${userID};`;
						db.any(insert_query) //update the database with newPantry
							.then(function (data) {
								finalPantryItems(res, userID);
								return;
							})
							.catch(function (err) {
								console.log('Issue with updating the database: ', err);
								return;
							});
					})
					.catch(function (err) {
						finalPantryItems(res, userID);
						return;
					})
			}
			//check if item is in pantry already
			else if (pantry.includes(information[1][0].ingredient_id)) {
				console.log("Item already in pantry");
				finalPantryItems(res, userID);
				return;
			}
			else { //Regular item being added to pantry
				var id = information[1][0].ingredient_id
				pantry.push(id);
				var insert_query = `UPDATE accounts SET pantry = '{${pantry}}' WHERE account_ID = ${userID};`;
				db.any(insert_query) //update the database with pantry
					.then(function (data) {
						finalPantryItems(res, userID);
						return;
					})
					.catch(function (err) {
						console.log('Error updating pantry: ', err);
						return;
					});
			}
		})
		.catch(function (err) {
			console.log('error', err);
			return;
		})
	})
	.catch(function (err) {
		console.log("Issue with getting current userID: ", err);
		return;
	});
});

app.post('/PantryChef/pantry/delete', function (req, res) {
	var userID_query = 'SELECT account_id FROM currentuser;';
	db.any(userID_query).then(function (userId) 
	{
	var userID = userId[0].account_id;
	var delItems = req.body.pantryCheck;
	console.log("Deleting: ", delItems);

	if (delItems == undefined) { //no items to delete
		finalPantryItems(res, userID);
		return;
	}
	
	let idFormat = `(`;
	if (typeof(delItems) != 'string') {
		for (var i = 0; i < delItems.length - 1; i++) {
			idFormat += `'` + delItems[i] + `', `;
		}
		idFormat += `'` + delItems[delItems.length - 1] + `')`;
	}
	else {
		idFormat += `'` + delItems + `')`;
	}
	
	var deleteItemsId_query = `SELECT ingredient_id FROM ingredients WHERE name IN ${idFormat};`;
	var getPantry_query = `SELECT pantry FROM "accounts" WHERE account_ID = ${userID};`;
	db.task('get-everything', task => {
		return task.batch([
			task.any(deleteItemsId_query),
			task.any(getPantry_query)
		]);
	})
		.then(function (info) {
			var delIds = info[0];
			var index;
			var pantry = info[1][0].pantry;
			for (var i = 0; i < delIds.length; i++) {
				index = pantry.indexOf(delIds[i].ingredient_id);
				pantry.splice(index,1);
			}
			var insert_query = `UPDATE accounts SET pantry = '{${pantry}}' WHERE account_ID = ${userID};`;
			db.any(insert_query) //update the database with pantry
				.then(function (data) {
					finalPantryItems(res, userID);
					return;
				})
				.catch(function (err) {
					console.log('Error updating pantry: ', err);
					return;
				});
			return;
		})
		.catch(function (err) {
			console.log('error', err);

			return;
		});
	})
	.catch(function (err) {
		console.log("Issue with getting current userID: ", err);
		return;
	});	
});

// addRecipe page
app.get('/PantryChef/addRecipe', function (req, res) {
	var userID_query = 'SELECT account_id FROM currentuser;';
	db.any(userID_query).then(function (userId) {
		var userID = userId[0].account_id;
		res.render('pages/addRecipe', {
			my_title: "Add Recipe",
			userID: userID,
			error: ""
		});
	})
	.catch(function (err) {
		console.log("Issue with getting current userID: ", err);
		return;
	});
});

app.post('/PantryChef/addRecipe', (req, res) => {
  res.json({
    status: 'success'
  }); 
  // Get and show data from add recipe web form
  const data = req.body;
  const name = data.recipe_name;
  const description = data.recipe_description; 
  const ttm = data.recipe_time;
  const servings = data.recipe_servings;
  const ingredients = data.recipe_ingredients;
  const ingredient_amounts = data.recipe_ingredient_amounts;
  const steps = data.recipe_steps;

  /*console.log("Trying to add a new recipe...");
  console.log("Recipe Name: " + name);
  console.log("Description: " + description);
  console.log("Time to make: " + ttm);
  console.log("Servings: " + servings);
  for (var i=0; i<ingredients.length; i++)
  {
    console.log("Ingredient: " + ingredients[i] + " Amount: " + ingredient_amounts[i]);
  } 
  for (var j=0; j<steps.length; j++)
  {
    console.log("Steps: " + steps[j]);
  }*/

  // Get id of ingredients from ingredients table
  //const ingredient_ids = getIngredientIds(ingredients);
  getIngredientIds(ingredients)
    .then(list_of_ingredient_ids => {
      //console.log("Here are the ingredient ids: " + list_of_ingredient_ids);
      // create sql scripts to insert recipes 
      // TODO: what do we do about the description of the recipe?  We should include that into the recipe database.
      const queryRecipe = "INSERT INTO recipes (username, name, prep_time, servings, ingredient_ids, ingredient_amounts, steps, image_source) VALUES ('User', '" + name + "', '" + ttm + "', '" + servings + "', '{" + list_of_ingredient_ids + "}', '{" + ingredient_amounts + "}', '{" + steps + "}', '../resources/img/pantry_chef.png')";
      //console.log("Called: " + queryRecipe);

      db.any(queryRecipe) 
      .then(function (info) {
        console.log(info); 
      })
      .catch(function (err) {
        console.log('error', err);
      })
    });
});

// Display Recipe page
app.get('/PantryChef/displayRecipe/:id/:db', function(req, res) {
	var userID_query = 'SELECT account_id FROM currentuser;';
	db.any(userID_query).then(function (userId) 
	{
	var userID = userId[0].account_id;
	const recipe_id = req.params.id;
	const isdb = req.params.db;
	console.log(isdb);
	console.log(recipe_id);


	if(recipe_id && isdb === "api") {
		axios({
			url: `https://api.spoonacular.com/recipes/${recipe_id}/information?&apiKey=e479e1aa6bfd4450a6a7cfbe9116f735`,
			method: 'GET',
			dataType:'json',
		})
			.then(items => {
				res.render('pages/displayRecipe',{
					my_title:"Recipe",
					ingredients: items.data.extendedIngredients,
					info: items.data,
					data: '',
					userID: userID,
					error: ""
				});
			})
			.catch(error => {
				console.log(error);
				res.render('pages/displayRecipe',{
					my_title:"Recipe",
					ingredients: '',
					info: '',
					data: '',
					userID: userID,
					error: ""
				});
			});

	}else{
		var query1 = "SELECT * FROM recipes WHERE recipe_id = '" + recipe_id + "';";
		var query2 = "SELECT * FROM ingredients;";
		db.task('get-everything', task => {
			return task.batch([
				task.any(query1),
				task.any(query2)
			]);
		})
			.then(info => {
				dbIngredients = {}
				info[1].forEach(function (item){
					dbIngredients[item.ingredient_id] = item.name;
				});
				res.render('pages/displayRecipe',{
					my_title:"Recipe",
					ingredients: dbIngredients,
					info: '',
					data: info[0][0],
					userID: userID,
					error: ""
				});
			}).
		catch(err => {
			res.render('pages/displayRecipe',{
				my_title:"Recipe",
				ingredients: '',
				info: '',
				data: '',
				userID: userID,
				error: err
			});
			}
		);
	}
	})
	.catch(function (err) {
		console.log("Issue with getting current userID: ", err);
		return;
	});	
});

// settings page
app.get('/PantryChef/settings', function(req, res) {
	var userID_query = 'SELECT account_id FROM currentuser;';
	db.any(userID_query).then(function (userId) 
	{
	var userID = userId[0].account_id;
	var query = `SELECT * FROM accounts WHERE account_id=${userID};`;
	db.any(query)
	.then(info => {
		res.render('pages/settings', {
			my_title: "Settings",
			row: info[0],
			userID: userID,
			error: ""
		})
	}).
	catch(err => {
		console.log("something is not right in initial setup");
		res.render('pages/settings', {
			my_title:"Error: No Account Found",
			row: '',
			userID: userID,
			error: ""
		})
		}
	);
	})
	.catch(function (err) {
		console.log("Issue with getting current userID: ", err);
		return;
	});	
});

app.post('/PantryChef/settings/changeName', function(req, res){
	var userID_query = 'SELECT account_id FROM currentuser;';
	db.any(userID_query).then(function (userId) 
	{

	var userID = userId[0].account_id;
	var acct_id = userID;
	var new_name = req.body.new_name;
	var edit_statement = `UPDATE accounts SET username='${new_name}' WHERE account_ID=${acct_id};`;
	var get_statement = `SELECT * FROM accounts WHERE account_ID=${acct_id};`;

	db.task('get-everything', task => {
		return task.batch([
			task.any(edit_statement),
			task.any(get_statement)
		]);
	})
	.then(info => {
		res.render('pages/settings',{
			my_title:"Settings",
			row: info[1][0],
			userID: userID,
			error: ""
		})
	})
	.catch(err => {
		res.render('pages/settings', {
			my_title:"Error: No Account Found",
			row: '',
			userID: userID,
			error: ""
		})
	});

	})
	.catch(function (err) {
		console.log("Issue with getting current userID: ", err);
		return;
	});	
});

app.post('/PantryChef/settings/changePassword', function(req, res){
	var userID_query = 'SELECT account_id FROM currentuser;';
	db.any(userID_query).then(function (userId) 
	{
	
	var userID = userId[0].account_id;
	var acct_id = userID;
	var new_pass = req.body.new_password;
	var edit_statement = `UPDATE accounts SET password='${new_pass}' WHERE account_ID=${acct_id};`;
	var get_statement = `SELECT * FROM accounts WHERE account_ID=${acct_id};`;

	db.task('get-everything', task => {
		return task.batch([
			task.any(edit_statement),
			task.any(get_statement)
		]);
	})
	.then(info => {
		res.render('pages/settings',{
			my_title:"Settings",
			row: info[1][0],
			userID: userID,
			error: ""
		})
	})
	.catch(err => {
		res.render('pages/settings', {
			my_title:"Error: No Account Found",
			row: '',
			userID: userID,
			error: ""
		})
	});
	})
	.catch(function (err) {
		console.log("Issue with getting current userID: ", err);
		return;
	});
});
app.post('/PantryChef/home/deleteAccount', function(req, res){ // settings
	var userID_query = 'SELECT account_id FROM currentuser;';
	db.any(userID_query).then(function (userId) 
	{
	
	var userID = userId[0].account_id;
	var acct_id = userID;
	var edit_statement = `DELETE FROM accounts WHERE account_ID=${acct_id};`;
	var changeCurrentUser_query = `UPDATE currentuser SET account_id = 1;`

	db.task('get-everything', task => {
		return task.batch([
			task.any(edit_statement),
			task.any(changeCurrentUser_query)
		]);
	})
	.then(info => {
		res.render('pages/home',{ // settings
			my_title:"Home",
			//row: '',
			userID: 1,
			error: ""
		})
	}).
	catch(err => { 
		res.render('pages/home',{ // settings
			my_title:"Error",
			//row: '',
			userID: 1,
			error: ""
		})
	});

	})
	.catch(function (err) {
		console.log("Issue with getting current userID: ", err);
		return;
	});
});

// displayRecipe page
app.get('/PantryChef/displayrecipe', function(req, res) {
	var userID_query = 'SELECT account_id FROM currentuser;';
	db.any(userID_query).then(function (userId) {
		var userID = userId[0].account_id;
		res.render('pages/displayrecipe',{
			my_title:"Display Recipe",
			userID: userID,
			error: ""		
		});
	})
	.catch(function (err) {
		console.log("Issue with getting current userID: ", err);
		return;
	});	
});

function finalPantryItems(res, userID) {
	var getPantry_query = `SELECT pantry FROM "accounts" WHERE account_ID = ${userID};`;
	db.any(getPantry_query)
		.then(function (data) {
			let pantry = data[0].pantry;
			let idFormat = '(';
			for (var i = 0; i < pantry.length - 1; i++) {
				idFormat += pantry[i] + ', ';
			}
			idFormat += pantry[pantry.length - 1] + ')';
			var ingredients_query = `SELECT name FROM ingredients WHERE ingredient_id IN ` + idFormat + `;`;
			db.any(ingredients_query) //find names of each ingredient
				.then(function (info) {
					res.render('pages/pantry', {
						my_title: "Pantry",
						pantry_contents: info,
						error: "",
						userID: userID
					});
					return;
				})
				.catch(function (err) {
					console.log('error', err);
					res.render('pages/pantry', {
						my_title: "Pantry",
						pantry_contents: ``,
						error: "",
						userID: userID
					});
					return;
				});
		})
		.catch(function (err) {
			console.log('error', err);
			res.render('pages/pantry', {
				my_title: "Pantry",
				pantry_contents: ``,
				error: "",
				userID: userID
			});
			return;
		});
}

// This takes in a list of ingredients and returns the ids from the ingredients table
// for each of them in an array.  If a particular ingredient isn't in the list, then
// this function will add it to the list and return that new id.
async function getIngredientIds(list_of_ingredients) {
  for (var i=0; i<list_of_ingredients.length; i++)
  {
    var addItem = list_of_ingredients[i];
    //addItem = addItem[0].toUpperCase() + (addItem.slice(1)).toLowerCase();

    var ingredients_query = "SELECT ingredient_id FROM ingredients WHERE name = '" + addItem + "';";
    await db.any(ingredients_query) 
      .then(function (info) {
        //console.log(info); 

	if (info[0] == undefined) {
	  // addItem is not in the database, so let's add it
	  console.log(addItem + " not in database");
          var addIngredient_query = `INSERT INTO ingredients (name) VALUES ('${addItem}');`;
	  db.any(addIngredient_query)
	    .catch(function (err) {
	      console.log('error', err);
	    })
	}
      })
      .catch(function (err) {
        console.log('error', err);
        return;
      })

  }
    
  // At this point all of the ingredients are in the database
  // so, we just need to get the list of ids
  var list_of_ingredient_ids = [];
  for (i=0; i<list_of_ingredients.length; i++)
  {
    var addItem = list_of_ingredients[i];
    //addItem = addItem[0].toUpperCase() + (addItem.slice(1)).toLowerCase();

    var ingredients_query = "SELECT ingredient_id FROM ingredients WHERE name = '" + addItem + "';";
    await db.any(ingredients_query) 
      .then(function (info) {
	let id = info[0].ingredient_id;
        list_of_ingredient_ids.push(id);
      })
      .catch(function (err) {
        console.log('error', err);
        return;
      })

  }
  console.log(list_of_ingredient_ids);

  return list_of_ingredient_ids;
}

module.exports = app.listen(7000, function(){
	console.log("Server started on port: 7000")
});
