

//init Spacetree
function init_spacetree(parse){
    //Create a new ST instance
    var st = new $jit.ST({
      //id of viz container element
      injectInto: 'infovis',
	    // set the orientation to vertical
    	orientation: "top",
	    levelsToShow: 50,
	    // show any number of levels
	    constrained: false,
      //set duration for the animation
      duration: 800,
      //set animation transition type
      transition: $jit.Trans.Quart.easeInOut,
      //set distance between node and its children
      levelDistance: 50,
      //enable panning
      Navigation: {
        enable:true,
        panning:true
      },

        //set node and edge styles
        //set overridable=true for styling individual
        //nodes or edges
        Node: {
            height: 20,
            width: 120,
            type: 'rectangle',
            color: '#aaa',
            overridable: true
        },
        
        Edge: {
            type: 'bezier',
            overridable: true
        },
        
        //This method is called on DOM label creation.
        //Use this method to add event handlers and styles to
        //your node.
        onCreateLabel: function(label, node){
            label.id = node.id;            
            label.innerHTML = node.name;
            label.onclick = function(){
            	if(normal.checked) {
            	  st.onClick(node.id);
            	} else {
                st.setRoot(node.id, 'animate');
            	}
            };
            //set label styles
            var style = label.style;
            style.width = 120 + 'px';
            style.height = 17 + 'px';            
            style.cursor = 'pointer';
            style.color = '#333';
            style.fontSize = '0.6em';
            style.textAlign= 'center';
            style.paddingTop = '3px';
        }       
    });
    st.canvas.clear();
    //load json data
    st.loadJSON(parse);
    //compute node positions and layout
    st.compute();
    //emulate a click on the root node.
    st.onClick(st.root);
    
}
