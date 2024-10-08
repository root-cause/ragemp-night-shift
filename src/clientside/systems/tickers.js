// event handlers
function onPlayerJoin(player) {
    mp.game.hud.beginTextCommandThefeedPost("TICK_JOIN");
    mp.game.hud.addTextComponentSubstringPlayerName(`<C>${player.name}</C>`);
    mp.game.hud.endTextCommandThefeedPostTicker(false, false);
}

function onPlayerDeath(player, killer) {
    mp.game.audio.playAmbientSpeechFromPositionNative("PAIN_DEATH", "HEN", 0.0, 0.0, 0.0, "SPEECH_PARAMS_FORCE_FRONTEND");

    if (killer == null || player === killer) {
        mp.game.hud.beginTextCommandThefeedPost("TICK_DIED"); // "<player> died."
        mp.game.hud.addTextComponentSubstringPlayerName(`<C>${player.name}</C>`);
        mp.game.hud.endTextCommandThefeedPostTicker(false, false);
        return;
    }

    if (killer === mp.players.local) {
        mp.game.hud.beginTextCommandThefeedPost("DM_TICK2"); // "You killed <player>."
        mp.game.hud.addTextComponentSubstringPlayerName(`<C>${player.name}</C>`);
        mp.game.hud.endTextCommandThefeedPostTicker(false, false);
    } else if (player === mp.players.local) {
        mp.game.hud.beginTextCommandThefeedPost("DM_TICK1"); // "<player> killed you."
        mp.game.hud.addTextComponentSubstringPlayerName(`<C>${killer.name}</C>`);
        mp.game.hud.endTextCommandThefeedPostTicker(false, false);
    } else {
        mp.game.hud.beginTextCommandThefeedPost("DM_TICK6"); // "<killer> killed <player>."
        mp.game.hud.addTextComponentSubstringPlayerName(`<C>${killer.name}</C>`);
        mp.game.hud.addTextComponentSubstringPlayerName(`<C>${player.name}</C>`);
        mp.game.hud.endTextCommandThefeedPostTicker(false, false);
    }
}

function onPlayerQuit(player) {
    mp.game.hud.beginTextCommandThefeedPost("TICK_LEFT");
    mp.game.hud.addTextComponentSubstringPlayerName(`<C>${player.name}</C>`);
    mp.game.hud.endTextCommandThefeedPostTicker(false, false);
}

// register event handlers
mp.events.add({
    "playerJoin": onPlayerJoin,
    "nightshift::death_ticker": onPlayerDeath,
    "playerQuit": onPlayerQuit
});
