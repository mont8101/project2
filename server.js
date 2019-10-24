// Built-in Node.js modules
var fs = require('fs')
var path = require('path')

// NPM modules
var express = require('express')
var sqlite3 = require('sqlite3')


var public_dir = path.join(__dirname, 'public');
var template_dir = path.join(__dirname, 'templates');
var db_filename = path.join(__dirname, 'db', 'usenergy.sqlite3');

var app = express();
var port = 8000;

// open usenergy.sqlite3 database
var db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
		TestSql();
    }
});

app.use(express.static(public_dir));


function TestSql() {
	db.all("SELECT * FROM Consumption WHERE year = ?" , ["1999"], (err, rows) => {
	//db.all("SELECT * FROM Consumption", (err, rows) => {
		if (err) {
			throw err;
		}
		else {
			//rows.forEach((row) => {
				console.log(rows[0]);
				console.log(rows[1]);
				console.log(rows[2]);
				console.log(rows[3]);
				console.log(rows[4]);
		//});
	};
});
}





// GET request handler for '/'
app.get('/', (req, res) => {
    ReadFile(path.join(template_dir, 'index.html')).then((template) => {
        let response = template;
        // modify `response` here
		db.all("SELECT * FROM Consumption WHERE year = ?" , ["2017"], (err, rows) => {
			var coal_count = 0;
			var natural_gas_count = 0;
			var nuclear_count = 0;
			var petroleum_count = 0;
			var renewable_count = 0;
			for(i = 0; i<rows.length; i++)
			{
				coal_count = coal_count + rows[i]["coal"];
				natural_gas_count = natural_gas_count + rows[i]["natural_gas"];
				nuclear_count = nuclear_count + rows[i]["nuclear"];
				petroleum_count = petroleum_count + rows[i]["petroleum"];
				renewable_count = renewable_count + rows[i]["renewable"];
				
			}
			template = template.toString();
			template = template.replace("var coal_count", "var coal_count = " + coal_count);
			template = template.replace("var natural_gas_count", "var natural_gas_count = " + natural_gas_count);
			template = template.replace("var nuclear_count", "var nuclear_count = " + nuclear_count);
			template = template.replace("var petroleum_count", "var petroleum_count = " + petroleum_count);
			template = template.replace("var renewable_count", "var renewable_count = " + renewable_count);
			template = template.replace("US Energy Consumption", "2017 US Energy Consumption");
			console.log(template);
			WriteHtml(res, response);
		});
    }).catch((err) => {
       Write404Error(res);
	});
});

// GET request handler for '/year/*'
app.get('/year/:selected_year', (req, res) => {
    ReadFile(path.join(template_dir, 'year.html')).then((template) => {
        let response = template;
        // modify `response` here
		var x = req.params.selected_year;
		var yearpath = "SELECT * FROM Consumption WHERE state_abbreviation = ?";
		db.all(yearpath , [x], (err, rows) => {
			if (err) {
				throw err;
			}
			else {
				let temp = x - 1960;
				res = rows[temp];
			};
		}); 
        WriteHtml(res, response);
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/state/*'
app.get('/state/:selected_state', (req, res) => {
    ReadFile(path.join(template_dir, 'state.html')).then((template) => {
        let response = template;
        // modify `response` here
		
        WriteHtml(res, response);
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/energy-type/*'
app.get('/energy-type/:selected_energy_type', (req, res) => {
    ReadFile(path.join(template_dir, 'energy.html')).then((template) => {
        let response = template;
        // modify `response` here
        WriteHtml(res, response);
    }).catch((err) => {
        Write404Error(res);
    });
});

function ReadFile(filename) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data.toString());
            }
        });
    });
}

function Write404Error(res) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write('Error: file not found');
    res.end();
}

function WriteHtml(res, html) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(html);
    res.end();
}


var server = app.listen(port);
