//initialize node modules
const mysql = require('mysql'); //node package used to interface with mysql
const inquirer = require('inquirer'); //node package to build prompts and CLI

//set empty connection variable at the global level
var connection;

//object containing all methods needed to initialize application
//first methods called by app
const initialize = {
  items: [],
  startConnection: function() {
    connection = mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'bamazon',
    })
  },
  getItems: function() {
    // query to pull all items from products table in bamazon DB
    connection.query('SELECT item_id, product_name, price, stock_quantity FROM products ORDER BY item_id ASC;', function(err,res){

      //if an error occurs, throw the error to the console
      if (err) throw err;

      //cycle through all received responses and append them to the items array to create list used in prompt
      for (let i = 0; i < res.length; i++) {
        initialize.items[i] = [res[i].item_id, `${res[i].product_name} - $${res[i].price}`,res[i].stock_quantity];
      }

      //after receiving items, run prompt with built array
      initialize.itemPrompt();
    })
  },

  itemPrompt: function() {
    inquirer.prompt([
      {
        type: 'rawlist',
        name: 'product',
        message: 'please select the id of the product you wish to purchase above',
        choices: arrayExtractor(initialize.items,1)
      },
    ])

    //once user has made a selection, it is passed into the store method qtyPrompt
        .then(selection => {
          store.selectedItemIndex = arrayExtractor(initialize.items, 1).indexOf(selection.product);
          store.qtyPrompt(store.selectedItemIndex);
        })
        .catch(err => {
          console.log(err)
        })
  },
};

//object containing all methods to handle purchase of an item
let store = {
  QoH: 0,
  selectedItemIndex: -1,
  qtyPrompt: function (itemIndex) {
    console.log('checking quantity');
    store.qtyCheck(store.selectedItemIndex);
    if (store.QoH < 1) {
      console.log("We are out of stock for that item!");
      process.exit();
    }

    inquirer.prompt([
      {
        type: 'input',
        name: 'qty',
        message: 'How much would you like to purchase?',
        validate: function(value) {
          if( !(isNaN(parseInt(value,10))) && parseInt(value,10) > 0) {
            return true
          }

          return 'Please enter a valid qty. Dont be a jerk'
        }
      },
    ])
        .then(input => {
          console.log('processing transaction...');
          let qty = parseInt(input.qty,10);
          if(store.QoH > qty) {
            let itemId = initialize.items[itemIndex][0];
            console.log(itemId);
            store.processTransaction(itemId,(store.QoH - qty))
          }
        })
        .catch(err => {
          console.log(err)
        })
  },
  qtyCheck: function (itemIndex) {
    let newQoH = initialize.items[itemIndex][2];
    store.QoH = newQoH;
  },

  processTransaction: function(itemId, qty) {
    connection.query(
        'UPDATE products SET stock_quantity = ? WHERE item_id = ?',
        [qty, itemId],
        function (err, res) {
          if (err) throw err;
          console.log(`${res.affectedRows} rows updated`);
          console.log('order successfully placed!')
        }
    )
  }
};

//code below initializes and runs the app

initialize.startConnection();
initialize.getItems();

const arrayExtractor = function(inputArray, colIndex){
  let newArray = [];
  for(let i = 0; i < inputArray.length; i++) {
    newArray.push(inputArray[i][colIndex])
  }
  return newArray;
};