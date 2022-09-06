-- Current UserID table
DROP TABLE IF EXISTS currentUser;
CREATE TABLE IF NOT EXISTS currentUser (
    filler SERIAL PRIMARY KEY,
    account_ID INT
);

-- Ingredients table
DROP TABLE IF EXISTS ingredients;
CREATE TABLE IF NOT EXISTS ingredients (
    ingredient_ID SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- Accounts table
DROP TABLE IF EXISTS accounts;
CREATE TABLE IF NOT EXISTS accounts (
    account_ID SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(50) NOT NULL,
    notify_settings BOOLEAN[] NOT NULL,
    pantry INT[]
);

-- Recipes table
DROP TABLE IF EXISTS recipes;
CREATE TABLE IF NOT EXISTS recipes (
    recipe_ID SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    name VARCHAR(80) NOT NULL,
    prep_time VARCHAR(50),
    servings FLOAT NOT NULL,
    ingredient_ids INT[] NOT NULL,
    ingredient_amounts VARCHAR(50)[] NOT NULL,
    steps VARCHAR[] NOT NULL,
    image_source VARCHAR(200) NOT NULL
);

-- Insert statements

INSERT INTO currentUser(account_ID)
VALUES (1);

INSERT INTO ingredients(name)
VALUES
('eggs'), 
('unsalted butter'), 
('all-purpose flour'), 
('granulated sugar'), 
('vanilla extract'), 
('dark chocolate chips'), 
('brown sugar'), 
('unsweetened cocoa powder'), 
('salt'), 
('Lillet Blanc'), 
('strawberry jam'), 
('strawberries'), 
('Creme Fraiche Glaze');

INSERT INTO accounts(username, password, notify_settings, pantry)
VALUES
('TheOriginal', '123456', ARRAY [TRUE, FALSE, FALSE, TRUE], ARRAY []::INT[]), 
('User2', 'password', ARRAY [FALSE, FALSE, FALSE, FALSE], ARRAY []::INT[]);

INSERT INTO recipes(username, name, prep_time, servings, ingredient_ids, ingredient_amounts, steps, image_source)
VALUES
('TheOriginal', 'Brownies with Strawberries', '', 12, ARRAY [5, 1, 3, 6, 2, 7, 8, 0, 9, 10, 11, 12], ARRAY ['2 cups', '1 1/2 cups', '2 1/4 cups', '1 1/2 cups', '2 1/4 cups', '1 1/8 cups', '1 tablespoon', '7 large', '4 tablespoons', '', '1 1/4 cups', ''],
ARRAY ['Preheat oven to 350°F (180°C). Lightly spray a 13x9-inch baking pan with cooking spray. Line pan with parchment paper, letting excess extend over sides of pan.',
'In the top of a double boiler, combine chocolate chips and butter. Cook over simmering water, stirring occasionally, until chocolate is melted and mixture is smooth. Turn off heat, and whisk in sugars. Remove from heat, and let cool slightly.', 
'In a medium bowl, whisk together flour, cocoa, and salt. Set aside.',
'In a small bowl, lightly whisk eggs. Add half of beaten eggs to chocolate mixture, whisking until combined. Add remaining beaten eggs, and whisk until combined. Whisk in 1 tablespoon (15 grams) Lillet Blanc. Fold in flour mixture until combined.',
'Spread half of batter (about 3½ cups) in prepared pan. Gently spread Strawberry Jam on top of batter, leaving a ½-inch border around edges. Spread remaining batter on top of jam, being careful not to mix with jam.',
'Bake until a wooden pick inserted in center comes out with a few moist crumbs, about 55 minutes. Let cool completely in pan. Brush remaining 3 tablespoons (45 grams) Lillet on top of brownie. Using excess parchment as handles, remove from pan. Arrange sliced strawberries on top of brownie. Top with Crème Fraîche Glaze. Cut into 12 brownies.'],
'https://www.bakefromscratch.com/wp-content/uploads/2019/01/brownie704JB.jpg'),
('User2', 'Not Brownies', '3 hours', 12, ARRAY [1, 2, 3, 4, 5, 7, 8, 9], ARRAY ['0 large', '0 cups', '0 cups', '0 tablespoons', '0 tablespoons', '0 tablespoons', '0 tablespoons', '0 tablespoons'],
ARRAY ['Is this a joke to you.', 'Clearly this is a joke recipe.'],
'../resources/img/pantry_chef.png');
    
-- inserting test recipes
-- INSERT INTO recipes(recipe_id, recipe_name, prepare_time, servings) 
-- VALUES (1, 'Spaghetti', '30 minutes', 4);
-- INSERT INTO ingredients(ingredient_id, recipe_id, ingredient_name, ingredients_amount)
