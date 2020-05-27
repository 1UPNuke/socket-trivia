$(function () {
    var socket = io();
    socket.on('chatMessage', function(data){writeMessage(data)});
    socket.on('usernameChange', function(data){$('#u').val(data);});
    $('#message').submit(function(e){
        e.preventDefault(); // prevents page reloading
        socket.emit('chatMessage', {message: $('#m').val()});
        $('#m').val('');
        return false;
    });
    $('#username').submit(function(e){
        e.preventDefault(); // prevents page reloading
        socket.emit('usernameChange', $('#u').val());
        return false;
    });
});

function writeMessage(data)
{
    let final = '';
    final += '<p style="color:#'+data.color+'">';
    final +=  toLocal(data.timestamp) + " ";
    final += '['+data.username+']: ';
    final += data.message + '</p>';
    $("#message-div")[0].innerHTML += final;
    $("#message-div")[0].children[$("#message-div")[0].children.length-1].scrollIntoView();
}

function toLocal(d)
{
    d = new Date(d);
    hh = d.getHours();
    mm = d.getMinutes();
    return ((hh<9?"0":"")+hh+":"+(mm<9?"0":"")+mm);
}