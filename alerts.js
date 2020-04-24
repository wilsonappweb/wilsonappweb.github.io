
var db;
var currentAlerts = []

function loadAlerts() {
    db.collection("alerts").orderBy("timestamp","desc").limit(25).onSnapshot(function(querSnapshot) {
        let datas = querSnapshot.docs.map(d => d.data())
        for (i = 0;i < datas.length; i++) {
            datas[i]["id"] = querSnapshot.docs[i].id
        }
        console.log(datas)
        setAlerts(datas)
    },function(error) {
        console.log("Error getting documents: ", error);
        UIkit.notification({
            message: 'Failed to get the past alerts!',
            status: 'danger',
            pos: 'bottom-right',
            timeout: 4000
        });
    });
}

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const alertCardHTML = `
<div class="uk-card uk-margin uk-card-default uk-card-body">
    <div class="uk-card-badge admin-delete-icons">
        <button onclick="deleteAlertPrompt('#id#')" class="uk-icon-link" uk-icon="trash"></button>
    </div>
    <h3 class="uk-card-title">#title#</h3>
    <p class="uk-text-meta">From #sender# on #date#</p>
    <p>#content#</p>
    #url#
</div>
`

const newAlertPromptHTML = `
<h3>Publish Alert?</h3>
<b>Title: </b>#title#<br>
<b>Sender: </b>#sender#<br>
<b>Content: </b>#content#<br>
<b>Attached URL: </b>#url#<br>
`

function deleteAlertPrompt(id) {
    UIkit.modal.confirm("Are you sure you want to delete this alert? This action cannot be undone.").then(function() {
        deleteAlert(id)
    }, function () {
        console.log('Canceled delete')
    });
}

function deleteAlert(id) {
    console.log("Will attempt to delete alert "+id+" from Firestore")
    db.collection("alerts").doc(id).delete().then(function() {
        UIkit.notification({
            message: 'Alert Deleted!',
            status: 'success',
            pos: 'bottom-right',
            timeout: 5000
        });
        console.log("Succesfully deleted an alert!")
    }).catch(function(error) {
        console.error("Error removing document: ", error);
        if (error.code == "permission-denied") {
            UIkit.modal.alert("You do not have permission to do this. You must have an active @pps.net Google account to delete alerts. Student accounts (@student.pps.net or @apps4pps.net) cannot be used.")
        } else {
            UIkit.modal.alert("An error occurred while trying to delete the alert: "+error.message)
        }
    });
    
}

function setAlerts(alerts) {
    //Update the global instance
    currentAlerts = alerts
    //Map it to HTML
    var htmls = alerts.map(a => alertCardHTML
        .replace("#content#",htmlEntities(a["content"]))
        .replace("#title#",htmlEntities(a["title"] || "New Alert"))
        .replace("#sender#",htmlEntities(a["sender"]))
        .replace("#date#",a["timestamp"].toDate().toLocaleString("en-US"))
        .replace("#url#",a["url"] ? "<a href='"+htmlEntities(a["url"])+"'>"+htmlEntities(a["url"])+"</a>" : "")
        .replace("#id#",a["id"])
    )
    var html = htmls.join("")
    $("#admin-prev-alerts").html(html)
    refreshDeleteIcons(currentUser)
}

function submit() {
    if (currentUser) {
        var title = $("#admin-input-title").val()
        title = (title == "" || title == null) ? "New Alert" : title
        var sender = $("#admin-input-sender").val()
        sender = (sender == "" || sender == null) ? currentUser.displayName : sender
        var content = $("#admin-input-content").val()
        content = (content == "" || content == null) ? null : content
        var url = $("#admin-input-url").val()
        url = (url == "" || url == null) ? null : url
        if (title,sender,content) {
            //Good to go
            $("#admin-input-content").removeClass("uk-form-danger")
            //Ask before sending
            UIkit.modal.confirm(
                newAlertPromptHTML
                .replace("#title#",htmlEntities(title))
                .replace("#sender#",htmlEntities(sender))
                .replace("#content#",htmlEntities(content))
                .replace("#url#",htmlEntities(url || "None"))
            ).then(function() {
                resetForm()
                firebaseSend(title,sender,content,url)
            }, function () {
                console.log('Canceled publish')
            });
        } else if (content == null) {
            $("#admin-input-content").addClass("uk-form-danger")
        }
    } else {
        UIkit.modal.alert("You must login before sending alerts")
    }
    
}

function firebaseSend(title,sender,content,url) {
    db.collection("alerts").add({
        title: title,
        sender: sender,
        content: content,
        url: url,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(function() {
        UIkit.notification({
            message: 'Sent!',
            status: 'success',
            pos: 'bottom-right',
            timeout: 5000
        });
        console.log("Succesfully sent a new alert!")
    })
    .catch(function(error) {
        console.error("Error writing document: ", error);
        if (error.code == "permission-denied") {
            UIkit.modal.alert("You do not have permission to do this. You must have an active @pps.net Google account to send alerts. Student accounts (@student.pps.net or @apps4pps.net) cannot be used.")
        } else {
            UIkit.modal.alert("An error occurred while trying to send the alert: "+error.message)
        }
        
    });
}

function resetForm() {
    $(".admin-create-input").val(null)
    if (currentUser) {
        $("#admin-input-sender").val(currentUser.displayName)
    }
}