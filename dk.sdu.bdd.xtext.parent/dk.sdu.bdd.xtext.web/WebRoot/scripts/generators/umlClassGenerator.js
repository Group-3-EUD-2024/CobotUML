// Function to recursively create JointJS cells from AST nodes
function createJointjsCells(root, umlWorkspace, parrentObj) {	
	// Return if ast is empty
	if (!root || !root._children)
		return "No children";
	
	// Get a bool value for if the root ast contains an array
	var childrenIsArray = Array.isArray(root._children);
	
	// Array of cells to add
	var cellsToAdd = [];
	
	// Loop to get the first children (always model if a model is specified)
	for (var i = 0; i < (childrenIsArray ? root._children.length : 1); i++) {

		// Get current child if any exists
		var current = childrenIsArray ? root._children[i]._children : root._children;
		
		// If a child exists continue.
		if (!current)
			continue;
		
		var currentParrentObj = parrentObj;
		
		// Check if the child has a value
		if (current.value) {
			console.log('Current value: ' + current.value._value);
			
			var parsedObj = parseValueString(current.value._value);
			console.log('Current Type: ' + parsedObj.type);
			console.log('Current id: ' + parsedObj.id);
			
			currentParrentObj = addJointjsCellToGraph(parsedObj, umlWorkspace, parrentObj, cellsToAdd);
		}
		
		// Check if the current child has any sub nodes (children)
		if (current.nodes) {
			// If it has run this function again with the current child as the root child.
			createJointjsCells(current.nodes, umlWorkspace, currentParrentObj);
		}
	}
	
	for (var i = 0; i < cellsToAdd.length; i++) {
		umlWorkspace.addCell(cellsToAdd[i]);
	}
}

function addJointjsCellToGraph(parsedObj, umlWorkspace, parrentObj, cellsToAdd) {
	let cell;
	
	console.log(parrentObj);
	
	// Generate cell
	cell = new joint.shapes.standard.HeaderedRectangle();
	cell .resize(225, 100);
	cell .position(200, 100);
	cell .attr('root/title', 'shapes.standard.HeaderedRectangle');
	cell .attr('header/fill', 'lightgray');
	if (parsedObj.id == null) {
		cell .attr('headerText/text', parsedObj.type);
	} else {
		cell .attr('headerText/text', (parsedObj.id + " (" + parsedObj.type + ")"));	
	}
	if (parrentObj != null) {
		console.log(parrentObj.id + ' is parrent to: ' + parsedObj.id);
		cell .attr('bodyText/text', (parrentObj.id + " (" + parrentObj.type + ")"));
	} else {
		cell .attr('bodyText/text', '');
	}
	
	// Add cell to cellsToAdd array so it can be added to the graph later
	cellsToAdd.push(cell)
	
	return parsedObj;
}
