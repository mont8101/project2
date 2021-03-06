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
				/*console.log(rows[0]);
				console.log(rows[1]);
				console.log(rows[2]);
				console.log(rows[3]);
				console.log(rows[4]);*/
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
			var table = "";
			for(i = 0; i<rows.length; i++)
			{
				coal_count = coal_count + rows[i]["coal"];
				natural_gas_count = natural_gas_count + rows[i]["natural_gas"];
				nuclear_count = nuclear_count + rows[i]["nuclear"];
				petroleum_count = petroleum_count + rows[i]["petroleum"];
				renewable_count = renewable_count + rows[i]["renewable"];
				table = table + "<tr><td>" + rows[i]["state_abbreviation"] + "</td>" +
					"<td>" + rows[i]["coal"] + "</td>" + 
					"<td>" + rows[i]["natural_gas"] + "</td>" + 
					"<td>" + rows[i]["nuclear"] + "</td>" + 
					"<td>" + rows[i]["petroleum"] + "</td>" + 
					"<td>" + rows[i]["renewable"] + "</td></tr>"
			}
			template = template.toString();
			template = template.replace("var coal_count", "var coal_count = " + coal_count);
			template = template.replace("var natural_gas_count", "var natural_gas_count = " + natural_gas_count);
			template = template.replace("var nuclear_count", "var nuclear_count = " + nuclear_count);
			template = template.replace("var petroleum_count", "var petroleum_count = " + petroleum_count);
			template = template.replace("var renewable_count", "var renewable_count = " + renewable_count);
			template = template.replace("US Energy Consumption", "2017 US Energy Consumption");
			template = template.replace("<!-- Data to be inserted here -->", table);
			console.log(template);
			response = template;
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
		db.all("SELECT * FROM Consumption WHERE year = ?" , [req.params.selected_year], (err, rows) => {
			var coal_count = 0;
			var natural_gas_count = 0;
			var nuclear_count = 0;
			var petroleum_count = 0;
			var renewable_count = 0;
			var table = "";
			var previous = parseInt(req.params.selected_year,10) - 1;
			var next = parseInt(req.params.selected_year,10) + 1;
			console.log(previous);
			if(req.params.selected_year == 1960)
			{
				previous = 1960;
			}
			if(req.params.selected_year == 2017)
			{
				next = 2017;
			}
			for(i = 0; i<rows.length; i++)
			{
				coal_count = coal_count + rows[i]["coal"];
				natural_gas_count = natural_gas_count + rows[i]["natural_gas"];
				nuclear_count = nuclear_count + rows[i]["nuclear"];
				petroleum_count = petroleum_count + rows[i]["petroleum"];
				renewable_count = renewable_count + rows[i]["renewable"];
				total = rows[i]["coal"] + rows[i]["natural_gas"] + rows[i]["nuclear"] + rows[i]["petroleum"] + rows[i]["renewable"];
				table = table + "<tr><td>" + rows[i]["state_abbreviation"] + "</td>" +
					"<td>" + rows[i]["coal"] + "</td>" + 
					"<td>" + rows[i]["natural_gas"] + "</td>" + 
					"<td>" + rows[i]["nuclear"] + "</td>" + 
					"<td>" + rows[i]["petroleum"] + "</td>" + 
					"<td>" + rows[i]["renewable"] + "</td>" + "<td>" + total + "</td></tr>";
			}
			template = template.toString();
			template = template.replace("National Snapshot", req.params.selected_year + " National Snapshot");
			template = template.replace("var year", "var year = " + req.params.selected_year);
			template = template.replace("var coal_count", "var coal_count = " + coal_count);
			template = template.replace("var natural_gas_count", "var natural_gas_count = " + natural_gas_count);
			template = template.replace("var nuclear_count", "var nuclear_count = " + nuclear_count);
			template = template.replace("var petroleum_count", "var petroleum_count = " + petroleum_count);
			template = template.replace("var renewable_count", "var renewable_count = " + renewable_count);
			template = template.replace("US Energy Consumption", req.params.selected_year + " US Energy Consumption");
			template = template.replace('href="">Prev','href="/year/' + previous+ '">' + previous); 
			template = template.replace('href="">Next','href="/year/' + next+ '">' + next );
			template = template.replace("<!-- Data to be inserted here -->", table);
			//console.log(template);
			response = template;
			WriteHtml(res, response);
		});
    }).catch((err) => {
        Write404Error(res);
	});
});

// GET request handler for '/state/*'
app.get('/state/:selected_state', (req, res) => {
    ReadFile(path.join(template_dir, 'state.html')).then((template) => {
        let response = template;
        // modify `response` here
		var states = [];
		var fullStates = [];
		
		db.all("SELECT * FROM States ORDER BY state_abbreviation", (err, rows) => {
			for(i = 0; i<rows.length; i++)
			{
				fullStates[i] = rows[i]["state_name"];
				//console.log(fullStates[i]);
			}			
			for(j = 0; j<rows.length; j++)
			{
				states[j] = rows[j]["state_abbreviation"];
				//console.log(states[j]);
			}
			db.all("SELECT * FROM Consumption WHERE state_abbreviation = ? ORDER BY year" , [req.params.selected_state], (err, rows) => {
				var state = req.params.selected_state;
				var coal_counts = []; 
				var natural_gas_counts = [];
				var nuclear_counts = [];
				var petroleum_counts = [];
				var renewable_counts = [];
				var state_position = states.indexOf(req.params.selected_state);
				var previous = state_position - 1;
				var next = state_position + 1
				if(state_position == 0)
				{
					previous = 50;
				}
				else if(state_position == 50)
				{
					next = 0;
				}
				var table = "";
				
				
				for(i = 0; i<rows.length; i++)
				{
					coal_counts[i] = rows[i]["coal"];
					natural_gas_counts[i] = rows[i]["natural_gas"];
					nuclear_counts[i] = rows[i]["nuclear"];
					petroleum_counts[i] = rows[i]["petroleum"];
					renewable_counts[i] = rows[i]["renewable"];
					total = rows[i]["coal"] + rows[i]["natural_gas"] + rows[i]["nuclear"] + rows[i]["petroleum"] + rows[i]["renewable"];
					table = table + "<tr><td>" + rows[i]["year"] + "</td>" +
						"<td>" + rows[i]["coal"] + "</td>" + 
						"<td>" + rows[i]["natural_gas"] + "</td>" + 
						"<td>" + rows[i]["nuclear"] + "</td>" + 
						"<td>" + rows[i]["petroleum"] + "</td>" + 
						"<td>" + rows[i]["renewable"] + "</td>" + "<td>" + total + "</td></tr>";
				}
				template = template.toString();
				template = template.replace("var state", "var state = " + "'" + fullStates[state_position] + "'");			
				template = template.replace("Yearly Snapshot", fullStates[state_position] + " Yearly Snapshot");	
				template = template.replace('noimage.jpg" alt="No Image"', state + '.jpg"' + ' alt="' + state + '"');
				template = template.replace("var coal_counts", "var coal_counts = " + "[" + coal_counts + "]");
				template = template.replace("var natural_gas_counts", "var natural_gas_counts = " + "[" +natural_gas_counts + "]");
				template = template.replace("var nuclear_counts", "var nuclear_counts = " + "[" +nuclear_counts + "]");
				template = template.replace("var petroleum_counts", "var petroleum_counts = " + "[" +petroleum_counts + "]");
				template = template.replace("var renewable_counts", "var renewable_counts = " + "[" +renewable_counts + "]");
				template = template.replace("US Energy Consumption", req.params.selected_state + " Energy Consumption");
				template = template.replace('href="">XX','href="/state/' + states[previous]+ '">' + states[previous]); 
				template = template.replace('href="">XX','href="/state/' + states[next]+ '">' + states[next]);
				template = template.replace("<!-- Data to be inserted here -->", table);
				
				response = template;				
				WriteHtml(res, response);
				});
			
			});
	}).catch((err) => {
		Write404Error(res);
	});
});
// GET request handler for '/energy-type/*'
app.get('/energy-type/:selected_energy_type', (req, res) => {
    ReadFile(path.join(template_dir, 'energy.html')).then((template) => {
        let response = template;
        // modify `response` here
		var energy_type = req.params.selected_energy_type;
        var energy_count = {};
		var energy =["coal", "natural_gas", "nuclear", "petroleum", "renewable"];
		var energy_position = energy.indexOf(energy_type);
		var total = 0;
		var table = "";
		var previous = energy_position - 1;
		var next = energy_position + 1
		if(energy_position == 0)
		{
			previous = 4;
		}
		else if(energy_position == 4)
		{
			next = 0;
		}	
			db.all("SELECT * FROM Consumption ORDER BY state_abbreviation,year", (err, rows) => {
				//console.log(rows);
				for(j = 0; j < rows.length; j++)
				{
					if(energy_count["state_abbreviation"] == undefined)
					{
					energy_count[rows[j]["state_abbreviation"]] = [];
					}
					
				}
				
				
			
				for(i = 0; i<rows.length; i++)
				{
					energy_count[rows[i]["state_abbreviation"]][energy_count[rows[i]["state_abbreviation"]].length] = rows[i][energy_type];					
				}		
				
				
				for(j = 0; j<58; j++)
				{
					table = table + "<tr><td>" + (rows[0]["year"]+j) + "</td>";
					for(energyAmount in energy_count)
					{	
						total = total + energy_count[energyAmount][j];		
						table = table + "<td>" + energy_count[energyAmount][j] + "</td>";
					}
					table = table + "<td>" + total + "</td>";
					total = 0;
				}
				
			temp = energy_type;
			if(temp === "natural_gas")
			{
				temp = "natural gas";
			}
			else
			{
				temp = energy_type;
			}
			
			template = template.toString();			
			template = template.replace("US Energy Consumption", "US " + energy_type + " Consumption");
			template = template.replace("energy_type", "energy_type = " + "'" + temp + "'");		
			template = template.replace("energy_counts","energy_counts = " +  JSON.stringify(energy_count));
			template = template.replace('noimage.jpg" alt="No Image"', energy_type + '.jpg"' + ' alt="' + energy_type + '"');
			template = template.replace('href="">XX',"href='" + energy[previous] + "'" + '">' + energy[previous]); 
			template = template.replace('href="">XX',"href='" + energy[next] + "'" + '">' + energy[next]); 
			template = template.replace("<!-- Data to be inserted here -->", table);			
			response = template;			
			WriteHtml(res, response);
		});
	
	}).catch((err) => {
		console.log(err);
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
