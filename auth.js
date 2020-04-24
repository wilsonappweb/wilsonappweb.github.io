
var currentUser;

//Only email accounts with this domain are allowed to make changes to the database
//Changing it on this page doesn't affect the database's own security rules
const acceptedDomain = "pps.net"

//Runs when the webpage has completed loading
function loaded() {

    //Get the Firebase configuration for setup
    //This needs to run after the page is loaded so that the firebase scripts are loaded
    var firebaseConfig = {
        apiKey: "AIzaSyAo61NxEwNtCCYK2FVaGS4EC9bZCa-0XJc",
        authDomain: "wilson-app-2.firebaseapp.com",
        databaseURL: "https://wilson-app-2.firebaseio.com",
        projectId: "wilson-app-2",
        storageBucket: "wilson-app-2.appspot.com",
        messagingSenderId: "655800211337",
        appId: "1:655800211337:web:b90624cc474c60fdab3358",
        measurementId: "G-SCLYNQ8YQ4"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    firebase.analytics();
    // Initialize Firestore
    db = firebase.firestore();

    console.log("Initialized Firebase");

    //Checks for any logged-in users
    firebase.auth().onAuthStateChanged(setUser);

    // Fetch and display previous alerts
    loadAlerts()
    
}

function refreshDeleteIcons(user) {
    $(".admin-delete-icons").hide()
    if (String(user.email).split("@")[1] == acceptedDomain) {
        //Authorized
        //Stop the create new alert spinner
        $(".admin-delete-icons").show()
    }
}

function logout() {
    firebase.auth().signOut()
    location.reload()
}

function setUser(user) {
    currentUser = user;
    //Hide the admin stuff
    $(".admin-create").hide()
    //Stop the create new alert spinner
    $("#admin-create-spinner").hide()
    //Hide the menu dropdown
    $("#admin-auth-dropdown").attr("hidden","true")
    //Decide what should be shown
    if (user) {
        console.log("A user is logged in")
        $(".admin-auth-button").text(user.displayName)
        $("#admin-auth-dropdown").removeAttr("hidden")
        //Set the sender field to the name of the person whos logged in
        $("#admin-input-sender").attr("placeholder",user.displayName)
        $("#admin-input-sender").val(user.displayName)
        //Set whether or not to show the fields
        if (String(user.email).split("@")[1] == acceptedDomain) {
            //Authorized
            //Shows the form for making a new alert
            $("#admin-create-form").show()
        } else {
            //Not authorized
            //Shows the alert that says you're not authorized.
            $("#admin-create-alert").show()
        }
    } else {
        console.log("Nobody is logged in")
        //Change the button at the top right to Log In
        $(".admin-auth-button").text("Log In")
        //Show the alert that says you have to login before making any alerts
        $("#admin-create-alert").show()
        $("#admin-create-login").show()
    }
    //Refresh the delete icons on the cards
    refreshDeleteIcons(user)
}

function changename() {
    UIkit.dropdown($("#admin-auth-dropdown")).hide(false);
    UIkit.modal.prompt('Name (Default value for "Sender" field)', '').then(function (name) {
        if (name && name != "" && /\S/.test(name) && currentUser) {
            currentUser.updateProfile({
                displayName: name
            }).then(function() {
                UIkit.notification({
                    message: 'Updated Name',
                    status: 'success',
                    pos: 'bottom-right',
                    timeout: 5000
                });
                setUser(currentUser)
            }).catch(function(error) {
                console.log("Update name error ",error)
                UIkit.modal.alert("An error occurred while trying to change your name: "+error.message)
            })
        }
    });
}

function loginbutton() {
    if (currentUser) {
        //Somebody is logged in
        console.log("The login button was clicked with somebody logged in")
    } else {
        //Nobody is logged in
        console.log("The login button was clicked with nobody logged in. Presenting popup.")
        loginWithGoogle()
    }
}

function loginWithGoogle() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then(function(result) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;
        //setUser should automatically be called by the onAuthStateChange listener
        //it would go here if it wasn't though

        //Checks if they are actually part of PPS staff
        if (String(user.email).split("@")[1] != acceptedDomain) {
            UIkit.modal.alert("It looks like you're not part of PPS staff. You will not be able to send alerts.")   
        }
      }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        console.log(errorMessage)
      });
}