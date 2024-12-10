// Function to recursively create JointJS cells from AST nodes
function createJointjsCells(root, umlWorkspace, parrentObj) {	
	// Return if ast is empty
	if (!root || !root._children)
		return "No children";
	
	// Get a bool value for if the root ast contains an array
	var childrenIsArray = Array.isArray(root._children);
	
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
			
			addJointjsCellToGraph(parsedObj, umlWorkspace)
		}
		
		// Check if the current child has any sub nodes (children)
		if (current.nodes) {
			// If it has run this function again with the current child as the root child.
			createJointjsCells(current.nodes, umlWorkspace, currentParrentObj);
		}
	}
}

function addJointjsCellToGraph(parsedObj, umlWorkspace, parrentObj) {
	let cell;
	
	// Define cases for each bddDsl
    switch (parsedObj.type) {
		case 'Model':
			cell = new joint.shapes.standard.HeaderedRectangle();
			cell .resize(150, 100);
			cell .position(200, 100);
			cell .attr('root/title', 'shapes.standard.HeaderedRectangle');
			cell .attr('header/fill', 'lightgray');
			cell .attr('headerText/text', (parsedObj.id + " (" + parsedObj.type + ")"));
			cell .attr('bodyText/text', '');
    }
	
	// Add object to uml workspace
	if (cell) {
		autosize(cell);
    }
}
