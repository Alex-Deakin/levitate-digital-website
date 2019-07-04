// Mouse tracking
var mousePos = {x: 0, y: 0};
var mouseMoveOffset = {x: 0, y: 0};
var mouseMoved = false;

// Bubble config
var container;
var minBubbles = 80;
var maxBubbles = 100;
var mobileMultiplier = 0.5;
var minDiameter = 40; // px
var maxDiameter = 250; // px
var minDepth = -500; // px
var maxDepth = 250; // px
var minAlpha = 0.02;
var maxAlpha = 0.08;
var moveMultiplier = 0.02;
var breatheIntensity = 50; // px
var breatheSpeedMultiplier = 1.25;
var spawnCooldown = 10; // milliseconds
var bubbleTimer;

// For timing
var timer = 0;
var then = Date.now();
var now;
var delta;

// Internet Explorer foolery
var ie = "ActiveXObject" in window;

// For mapbox
mapboxgl.accessToken = "pk.eyJ1IjoicGl4ZWxkb2ciLCJhIjoiY2p2NDZ0ZHZwMDZjbzRicW92aWEweWY1OCJ9.EW9Q9XRMSFr0OBRr7daJNg";

window.addEventListener("DOMContentLoaded", function() {
    if (isCached("img/splash-bg.png")) {
        document.querySelector("#splash-img").style.opacity = 1;
    }
    // Initialising DOM-dependant variables
    container = document.querySelector("#bubble-container");
    var mobile = checkMobile();

    window.addEventListener("load", function(e) {
        if (document.querySelector("#splash-img").style.opacity !== "1") {
            document.querySelector("#splash-img").style.animation = "fade-in 8s forwards";
        }
        setTimeout(function() {
            // Mapbox init - for some reason this really janks the page when it fires, so I've delayed it by several seconds to give the page a chance
            if (document.querySelector("#map") !== null) {
                var map = new mapboxgl.Map({
                    container: "map",
                    style: "mapbox://styles/mapbox/streets-v11?optimize=true",
                    center: [-0.7527273, 51.4237777],
                    zoom: 16
                });
                new mapboxgl.Marker({
                    color: "#ed1f34"
                }).setLngLat([-0.7527273, 51.4237777]).addTo(map);
            }
        }, 6000);
    });

    // Mouse move listener
    document.addEventListener("mousemove", function(e) {
        // Update mouse position variables with each movement
        mousePos.x = e.clientX - (window.innerWidth / 2);
        mousePos.y = Math.round(e.clientY - (window.innerHeight / 2));
        // When the mouse is first moved on the page, account for its offset to prevent any jarring movement to its position
        if (!mouseMoved) {
            mouseMoveOffset.x = mousePos.x;
            mouseMoveOffset.y = mousePos.y;
            mouseMoved = true;
        }
    });

    // Window resize listener
    window.addEventListener("resize", function() {
        // If we have resized from desktop
        if (mobile !== checkMobile()) {
            // Update the mobile variable
            mobile = checkMobile();
            if (mobile) {
                clearTimeout(bubbleTimer); // Stop generating bubbles
                var bubbles = document.querySelectorAll(".bubble");
                for (var i = bubbles.length - 1; i >= 0; i--) {
                    bubbles[i].parentElement.removeChild(bubbles[i]); // Clear existing bubbles
                }
            } else {
                var numBubbles = minBubbles + (Math.random() * (maxBubbles - minBubbles));
                generateBubbles(container, numBubbles, minDiameter, maxDiameter, minDepth, maxDepth, minAlpha, maxAlpha); // Re-generate bubbles with device-specific parameters
            }
        }
    });

    // Scroll listener
    window.addEventListener("scroll", function() {
        // Toggle header visibility dependant upon distance from page ceiling
        if (window.pageYOffset <= 50) {
            document.querySelector("#header").classList.add("transparent");
        } else {
            document.querySelector("#header").classList.remove("transparent");
        }
    });
    // Trigger the scroll listener on load
    var event = document.createEvent('Event');
    event.initEvent('scroll', true, true);
    document.body.dispatchEvent(event);

    // Nav drawer click listeners
    document.querySelector(".nav-open").addEventListener("click", function() {
        document.querySelector(".nav").classList.add("show");
    });
    for (var i = 0; i < document.querySelectorAll(".nav-close").length; i++) {
        document.querySelectorAll(".nav-close")[i].addEventListener("click", function() {
            document.querySelector(".nav").classList.remove("show");
        });
    }

    // Contact form submit button override
    document.querySelector("#contact-submit").addEventListener("click", function(e) {
        var form = document.querySelector("#contact-form");
        var data = serialize(form);
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "scripts/sendQuery.php");
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send(encodeURI(data));
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) { // Done
                try {
                    var response = JSON.parse(xhr.responseText);
                } catch(err) {
                    var response = {message: `An error occured: ${err}`}
                }
                if (xhr.status === 200) { // Success
                    if (response.redirectUrl !== undefined) {
                        window.location.href = response.redirectUrl;
                    } else if (response.message !== undefined) {
                        alert(response.message);
                    } else {
                        alert(xhr.responseText);
                    }
                } else {
                    alert(xhr.responseText);
                }
            }
        };
        e.preventDefault();
    });

    // Rainbow meta theme for Chrome on Android
    // if (/(android)/i.test(navigator.userAgent)) {
    //     changeThemeColor(0.00, "inc");
    // }

    // Random number of bubbles
    var numBubbles = minBubbles + (Math.random() * (maxBubbles - minBubbles));
    // numBubbles *= mobileMultiplier; // Mobile devices need fewer bubbles to populate the screen

    if (!mobile && !ie) {
        // Start spawning the bubbles
        generateBubbles(container, numBubbles, minDiameter, maxDiameter, minDepth, maxDepth, minAlpha, maxAlpha);
        // Start animating them
        window.requestAnimationFrame(bubbleTick);
    }
});

function generateBubbles(element, numBubbles, minDiameter, maxDiameter, minDepth, maxDepth, minAlpha, maxAlpha) {
    // Create random bubble parameters
    var diameter = Math.round(minDiameter + (Math.random() * (maxDiameter - minDiameter)));
    var posx = Math.round((Math.random() * 150) - 25);
    var posy = Math.round((Math.random() * 150) - 25);
    var depth = Math.round(minDepth + (Math.random() * (maxDepth - minDepth)));
    var alpha = (minAlpha + (Math.random() * (maxAlpha - minAlpha))).toPrecision(3);
    // Initialise the bubble
    var bubble = document.createElement("div");
    bubble.classList.add("bubble");
    bubble.style.width = `${diameter}px`;
    bubble.style.height = `${diameter}px`;
    bubble.style.backgroundColor = `rgba(255, 255, 255, ${alpha})`;
    bubble.style.transform = `translate3d(${posx}vw, ${posy}vh, ${depth}px)`;
    bubble.setAttribute("data-posx", posx);
    bubble.setAttribute("data-posy", posy);
    bubble.setAttribute("data-depth", depth);
    // Add it to the target element
    element.appendChild(bubble);
    if (numBubbles > 0) {
        // If we still have bubbles left to generate, re-run this function after a short delay
        bubbleTimer = setTimeout(generateBubbles, spawnCooldown, element, --numBubbles, minDiameter, maxDiameter, minDepth, maxDepth, minAlpha, maxAlpha);
    }
}

function bubbleTick() {
    if (checkVisible(document.querySelector("#parallax"))) { // Only animate the bubbles if the container is visible
        // Timing stuff
        now = Date.now();
        delta = now - then;
        // Breathing / bobbing animation powered by sine curves (thanks GCSE maths)
        if (timer >= Math.PI) {
            timer = -Math.PI;
        }
        var breatheOffset = Math.sin(timer) * breatheIntensity;
        // More timing stuff
        timer += delta / 1000 * breatheSpeedMultiplier;
        then = Date.now();
        var bubbles = document.querySelectorAll(".bubble"); // Get all of the current bubbles
        for (var i = 0; i < bubbles.length; i++) {
            // Grab their X, Y, and Z co-ordinates from their HTML "data-..." attributes, and apply a mouse position based offset
            var posX = parseInt(bubbles[i].getAttribute("data-posx")) + (mousePos.x - mouseMoveOffset.x) * moveMultiplier;
            var posY = parseInt(bubbles[i].getAttribute("data-posy")) + (mousePos.y - mouseMoveOffset.y + breatheOffset) * moveMultiplier;
            var depth = parseInt(bubbles[i].getAttribute("data-depth"));
            bubbles[i].style.transform = `translate3d(${posX}vw, ${posY}vh, ${depth}px)`; // Update each bubble's transform accordingly
        }
    }
    // Repeat for the next available animation frame
    window.requestAnimationFrame(bubbleTick);
}

function checkMobile() {
    return window.matchMedia("screen and (max-width: 640px)").matches; // If screen width < 640px, return true
}

function checkVisible(el) {
    var rect = el.getBoundingClientRect();
    var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
    return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
}

function changeThemeColor(hue, mode) {
    if (hue >= 0.8) { mode = "dec" } else if (hue <= 0.001) { mode = "inc" };
    (mode === "inc") ? hue += 0.001 : hue -= 0.001;
    var color = hsvToHex(hue, 1, 0.5);
    var metaThemeColor = document.querySelector("meta[name=theme-color]");
    metaThemeColor.setAttribute("content", color);
    setTimeout(function() {
        changeThemeColor(hue, mode);
    }, 100);
}

function hsvToHex(h, s, v) {
    let r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return "#" + ((1 << 24) + ((Math.round(r * 255)) << 16) + ((Math.round(g * 255)) << 8) + (Math.round(b * 255))).toString(16).slice(1);
}

function serialize (form) {
	// Setup serialized data
	var serialized = [];
	// Loop through each field in the form
	for (var i = 0; i < form.elements.length; i++) {
		var field = form.elements[i];
		// Don't serialize unnamed fields, submits, buttons, file and reset inputs, and disabled fields
		if (!field.name || field.disabled || field.type === "file" || field.type === "reset" || field.type === "submit" || field.type === "button") continue;
		// If a multi-select, get all selected values
		if (field.type === 'select-multiple') {
			for (var n = 0; n < field.options.length; n++) {
				if (!field.options[n].selected) continue;
				serialized.push(encodeURIComponent(field.name) + "=" + encodeURIComponent(field.options[n].value));
			}
		}
		else if ((field.type !== 'checkbox' && field.type !== 'radio') || field.checked) {
			serialized.push(encodeURIComponent(field.name) + "=" + encodeURIComponent(field.value));
        }
        else if (field.type === 'checkbox' || field.type === 'radio') {
			serialized.push(encodeURIComponent(field.name) + "=" + encodeURIComponent(field.checked));
        }
	}
	return serialized.join('&');
};

function isCached(imgUrl) {
    var image = document.createElement("img");
    image.src = imgUrl;
    return image.complete;
}