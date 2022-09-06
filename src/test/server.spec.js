// Imports the server.js file to be tested.
const server = require("../server");
// Assertion (Test Driven Development) and Should,  Expect(Behaviour driven 
// development) library
const chai = require("chai");
// Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require("chai-http");
chai.should();
chai.use(chaiHttp);
const { assert, expect } = chai;

describe("Server!", () => {
    // operational test
    it("Returns the default homepage", (done) => {
        chai
          .request(server)
          .get("/PantryChef")
          .end((err, res) => {
            expect(res).to.have.status(200);
            done();
          });
    });

    // user acceptance tests
    it("Creates a recipe from all required info", (done) => {
      chai
        .request(server)
        .post("/PantryChef/addRecipe")
        .send({
          recipe_name: "Sample Recipe",
          recipe_description: "This is a sample recipe made to test the functionality.",
          recipe_time: 0,
          recipe_servings: 1,
          recipe_ingredients: [9],
          recipe_ingredient_amounts: ["A fair amount"],
          recipe_steps: ["Please delete this recipe."]
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          //expect(res.body.result).to.equals(6, "Add does not give correct result.");
          done();
        });
    });
    it("Fails to create a recipe from insufficient info", (done) => {
      chai
        .request(server)
        .post("/PantryChef/addRecipe")
        .send({
          recipe_name: "Bad Recipe Request",
          recipe_description: "This is a bad recipe request without all neccessary fields, if you see this in the database something has gone wrong.",
          recipe_time: 0,
          recipe_servings: 1,
          recipe_ingredients: [],
          recipe_ingredient_amounts: [],
          recipe_steps: []
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });
    it("Logs in user with valid credentials", (done) => {
      chai
        .request(server)
        .post("/PantryChef/login")
        .send({
          username: "User2",
          password: "password"
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.text).to.contain('<title>Home</title>');
          expect(res.text).to.contain('<a class="navbar-brand" href="/PantryChef/addRecipe">Add Recipes <span class="sr-only">(current)</span></a>');
          expect(res.text).to.contain('<button class="btn btn-default" type="submit">Logout</button>');
          done();
        });
        // log out for next attempt
        chai.request(server).post("/PantryChef/logout").end();
    });
    it("Rejects user with invalid credentials", (done) => {
      chai
        .request(server)
        .post("/PantryChef/login")
        .send({
          username: "#000000",
          password: "badpassword"
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.text).to.contain('<title>Home</title>');
          expect(res.text).to.contain('<strong>Error</strong> Invalid Login');
          done();
        });
    });
    it("Search by keyword gives proper results", (done) => {
      chai
        .request(server)
        .post("/PantryChef/searchRecipe")
        .send({
          search: "Brownies"
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          var results = res.text.match(/<div class="row searchRow">/);
          expect(results.length).to.lessThanOrEqual(10);
          done();
        });
    });
    it("Search by ingredients gives proper results", (done) => {
      // log in
      chai.request(server)
      .post("/PantryChef/login")
      .send({username: "User2", password: "password"})
      .end((err, res) => {
        // add to pantry
        chai.request(server)
        .post('/PantryChef/pantry/add')
        .send({pantry_item: "Strawberries"})
        .end((err, res) => {
          // search
          chai
          .request(server)
          .get("/PantryChef/searchByIngredients")
          .end((err, res) => {
            expect(res).to.have.status(200);
            var results = res.text.match(/<div class="row searchRow">/);
            expect(results.length).to.lessThanOrEqual(10);
            done();
          });
        });
      });
    });

});