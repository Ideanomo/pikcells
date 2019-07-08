(function () {
    /*Define global variables that will be used later*/

    // Array to hold the different layers in the config object
    var layersArray = [];
    // Array for images loaded from menu item clicks
    var imagesLoadedArray = [];
    // Array to hold the default_configuration values
    var defaultConfigArray = [];
    // Array to hold images initialised using default_configuration
    var initImagesArray = [];
    // Array to hold saved configs of user
    var imagesToSaveArray = [];

    // Canvas elements
    var canvas0 = document.getElementById('canvas-0');
    var canvas1 = document.getElementById('canvas-1');
    var canvas2 = document.getElementById('canvas-2');
    // Canvas elements 2d contexts
    var ctx0 = canvas0.getContext('2d');
    var ctx1 = canvas1.getContext('2d');
    var ctx2 = canvas2.getContext('2d');

    // Counter to keep track of images loaded from menu item clicks
    var imagesLoaded = 0;
    // Get a reference to the menu
    var menu = document.getElementById('menu');
    // An element for testing purposes. It displays the current default_config values at the top of the screen
    var defaultConfigP = document.getElementById('default-config');

    // A variable that references the config object
    var configObj;

    // Create a new image. Used to render all images
    var image = new Image();

    // Get the parent nodes layer number
    var ulNumber;

    var save = false; // Has the user clicked the save button?
    var initBool = false; // Are images being initialised from default config?

    // Outputs
    var selectThreeOutput = document.getElementById('selectThreeOutput');
    var imageSavedOutput = document.getElementById('imageSavedOutput');

    var resetButton = document.getElementById('resetButton');

    // Create reference to save button and listen for a mousedown event
    var saveButton = document.getElementById('save-button');
    saveButton.addEventListener('mousedown', saveButtonHandler, false);

    var indexValue = 0; // Manual iterator
    var value = 0; // Value from default_config

    // Define urls
    var imageBaseUrl = 'https://s3.eu-west-2.amazonaws.com/pikcells-lab/code-exercise/images/';
    var jsonData = 'https://lab.pikcells.com/code-exercise/data.json';

    var menuItemsSelected = 0; // How many menu items have been selected?

    // Get the config JSON
    getData(jsonData);

    // Function to get either the image or the config JSON. See notes at bottom of page.
    function getData (url, imgSrc) {
        var xhr = new XMLHttpRequest();

        if (imgSrc !== undefined && url === imageBaseUrl) { // Are you getting an image?
            xhr.open('GET', 'https://s3.eu-west-2.amazonaws.com/pikcells-lab/code-exercise/images/' + imgSrc);
            // Set xhr response type
            xhr.responseType = 'blob';

            xhr.onreadystatechange = function () {
                if (this.readyState === this.DONE && this.status === 200) {
                    if (this.response) { // Check for response
                        var blob = this.response;
                        image.src = window.URL.createObjectURL(blob);

                        image.onload = function() {
                            if (initBool === true) { // Are you initialising using the default_configuration?
                                initImagesArray.push(image);
                                imagesLoaded ++;

                                // console.log('initImagesArray');
                                // console.log(initImagesArray);

                                render();
                                indexValue++; // Move through the defaultConfigArray only after each previous image has rendered
                                value++; // Get the next value
                                init();
                            } else if (initBool === false) { // If you're not initialising default_configuration
                                render();
                            }
                        }
                    } else {
                        console.log('Error no image data');
                    }
                }
            };
            xhr.send();
        } else if (url === jsonData) { // Are you getting the config json only?
            xhr.open('GET', 'https://lab.pikcells.com/code-exercise/data.json');
            // Set xhr response type
            xhr.responseType = 'text';

            xhr.onreadystatechange = function () {
                if (this.readyState === this.DONE && this.status === 200) {
                    if (this.responseText) { // Check for responseText
                        parseJsonData(this.responseText); // Parse the JSON
                        addLayerTopage();
                    } else {
                        console.log('Error no json data');
                    }
                }
            };
            xhr.send();
        }
    }

    // Parse JSON data
    function parseJsonData (json) {
        // debugger;
        if (json === null || json.trim() === '') {
            return;
        }
        // Parse responseText
        configObj = JSON.parse(json); //  Now it's a JS object

        // So get default config values
        var defaultConfig = configObj.default_configuration; // It's an array now
        // Loop through default_config
        for (var k = 0; k < defaultConfig.length; k++) {
            defaultConfigArray.push(defaultConfig[k]);
        }

        // Store object's "layers" in an array
        for (var i = 0; i < configObj.layers.length; i++) {
            layersArray.push(configObj.layers[i]);
        }

        // For testing purposes, I am displaying the default_configuration values on the screen to save me from looking them up manually each time
        defaultConfigP.innerHTML = 'Default configuration: ' +  configObj.default_configuration;

        // Initialise showing a pre-determined default configuration TODO: 'Get in the correct order. maybe use z-index'
        init();
    }

    function init () {
        if (imagesLoaded < 3) { // Instead of hard coding this value, could use length of defaultConfigArray
            initBool = true;
            // Loop through defaultConfigArray and get values to use as indexes
            var index = indexValue;
            var indexToGetSrc = defaultConfigArray[value];
            // Get image based on default config value
            var defaultImageSrc = layersArray[index].items[indexToGetSrc].imgSrc;
            getData(imageBaseUrl, defaultImageSrc);
        } else if (imagesLoaded === 3) {
            initBool = false; // Set initBool to false if the user has clicked on 3 items.
        }
    }

    // Add layers to page
    function addLayerTopage () {
        for (var i = 0; i < layersArray.length; i++) { // Always three layers to loop
            var layerOrderValue = layersArray[i].order; // Get order values of each layer * not each item
            var ul = document.createElement('ul');
            ul.setAttribute('number', i); // Add attribute to specify which layer the ul belongs to
            var h2 = document.createElement('h2'); // Create a <h2> element> to show the "Order" value of the layer
            h2.innerHTML = 'Layer: ' + layerOrderValue; // Add order value of each layer to the <h2> element
            ul.appendChild(h2); // Add the h2 element to the page.
            menu.appendChild(ul);
            // Sort order values for items in each layer
            var layersItems = layersArray[i].items; // Get items for each layer
            layersItems.sort(function(item1, item2) {
                return item1.order-item2.order;
            });

            // Loop through items
            for (var j = 0; j < layersItems.length; j++) {
                var  obj = layersItems[j]; // Each item
                var li = document.createElement('li');
                li.setAttribute('class', 'layer-item');
                li.innerHTML = obj.name;
                li.addEventListener('mousedown', mousedownHandler, false);
                ul.appendChild(li);
            }
        }
    }

    // Save users chosen images configuration
    function saveButtonHandler (itemToSave) { // itemToSave is an object created when image fetched
        save = true;

        if (menuItemsSelected === 3) {
            if (localStorage) {
                var key = 'User\'s saved images'; // Set key value
                var item = JSON.stringify(imagesToSaveArray); // Set item value to config JSON string
                localStorage.setItem(key, item); // Save config to localStorage. Overwritten on each save event as same key used.
                imageSavedOutput.innerHTML = 'Your image has been saved.'
            }
        } else {
            selectThreeOutput.innerHTML = 'Please select three items before saving.'
        }
    }

    // Item constructor. This creates an object config with image name and src
    function SaveImage (name, srcImg) {
        this.name = name;
        this.srcImg = srcImg;
    }

    // Do this when a menu item is clicked
    function mousedownHandler (event) {
        menuItemsSelected++;

        // Have 3 items been selected and is output empty
        if (menuItemsSelected === 3 && selectThreeOutput.innerHTML.length !== 0) {
            selectThreeOutput.removeChild(selectThreeOutput.firstChild);
        }

        // If you change your mind about your 3 selection you can change
        resetButton.addEventListener('click', resetButtonHandler, false);

        event.preventDefault();
        event.stopPropagation();

        // Get the node clicked on
        var li = event.target;
        // Add selected class to li that was clicked
        li.classList.add('selected');

        // Get the parent node
        var ul = event.target.parentNode;
        // Add 'no-more-clicks' class to ul
        ul .classList.add('no-more-clicks');

        // Get the parent nodes layer number
        ulNumber = event.target.parentNode.attributes.number.value;

        // Get layer name that was clicked
        var layerName = event.target.innerHTML;

        // Loop through layers to find correct imgSrc for layer name
        for (var i = 0; i < layersArray.length; i++) {
            var layersItems = layersArray[i].items; // Get items for each layer

            for (var j = 0; j < layersItems.length; j++) {
                var  obj = layersItems[j]; // Each item
                // Check for match and get image src
                if (obj.name === layerName) {
                    var imageSrc = obj.imgSrc;
                    // Get image
                    getData(imageBaseUrl, imageSrc, ulNumber);

                    // Save config of each clicked item in case user wants to save
                    var saveThisImage = new SaveImage(layerName, imageSrc);
                    imagesToSaveArray.push(saveThisImage); // Add saved image to array

                    // console.log('imagesToSaveArray');
                    // console.log(imagesToSaveArray);
                }
            }
        }
    }

    // Reset after 3 selections made
    function resetButtonHandler () {
        if (menuItemsSelected === 3) { // You can only change your mind if you have already selected 3 items
            var li = document.querySelectorAll('li');

            // loop through node list and  remove 'selected' class from them
            li.forEach(function(li) {
                li.classList.remove('selected');
            });

            var ul = document.querySelectorAll('ul');

            // loop through node list and  remove 'selected' class from them
            ul.forEach(function(ul) {
                ul.classList.remove('no-more-clicks');
            });

            // Reset menuItemsSelected to 0
            menuItemsSelected = 0;

            // Empty images to be saved array if user changes their mind
            imagesToSaveArray.length = 0;

            if (imageSavedOutput.innerText.length !== 0) { // If the user has saved images and now wants to reset
                imageSavedOutput.removeChild(imageSavedOutput.firstChild);  // Remove the output that says 'Your image has been saved'
            }
            // console.log('imagesToSaveArray');
            // console.log(imagesToSaveArray);
        }
    }

    function render () {
       /* Leave 3 clearRect()'s below commented out.
         This is so the canvas' are *not* cleared and the images overlap each other because they
         are already transparent and each ctx is for a canvas with a different
         z-index. So each canvas will not clear the image and they get layered on top of each other.
     */

        //ctx0.clearRect(0, 0, canvas.width, canvas.height);
        //ctx1.clearRect(0, 0, canvas.width, canvas.height);
        //ctx2.clearRect(0, 0, canvas.width, canvas.height);

        /* The ulNumber will be undefined if you got here whilst initBool === true;
        * console.log('ulNumber');
        * console.log(ulNumber);
        */

        // Render the image on a different canvas (with a z-index of 0, 1 or 2) depending on it layer number. Could also use a switch statement here.
        if (ulNumber === 0) {
            ctx0.drawImage(
                image, 0, 0, canvas0.width, canvas0.height
            )
        } else if (ulNumber === 1) {
            ctx1.drawImage(
                image, 0, 0, canvas1.width, canvas1.height
            )
        } else if (ulNumber === 2) {
            ctx2.drawImage(
                image, 0, 0, canvas2.width, canvas2.height
            )
        } else {
            ctx0.drawImage(
                image, 0, 0, canvas0.width, canvas0.height
            )
        }

        if (initBool === false) {
            imagesLoadedArray.push(image);

            // console.log('imagesLoadedArray');
            // console.log(imagesLoadedArray);
        }/* else {
            console.log('it\'s a default_config init() image');
        }*/
    }
})();