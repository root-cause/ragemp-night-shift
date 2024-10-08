import { waitFor, runScaleformMethod } from "../util";

// script constants
const CAMERA_DATA = [
    { name: "FACTORY ENTRANCE", position: new mp.Vector3(-66.24, 6264.712, 34.228), rotation: new mp.Vector3(-20.614, 0.0, 91.52) },
    { name: "OFFICE ENTRANCE", position: new mp.Vector3(-74.273, 6249.052, 34.466), rotation: new mp.Vector3(-32.047, 0.0, -22.287) },
    { name: "DELIVERY CORRIDOR", position: new mp.Vector3(-77.227, 6235.475, 33.906), rotation: new mp.Vector3(-31.354, 0.0, -29.913) },
    { name: "PROCESSING 1", position: new mp.Vector3(-82.476, 6241.085, 33.231), rotation: new mp.Vector3(-13.685, 0.0, 162.172) },
    { name: "PROCESSING 2", position: new mp.Vector3(-81.382, 6217.115, 36.851), rotation: new mp.Vector3(-21.567, 0.0, -21.186) },
    { name: "PACKING 1", position: new mp.Vector3(-97.045, 6220.9, 33.271), rotation: new mp.Vector3(-14.725, 0.0, -166.146) },
    { name: "PACKING 2", position: new mp.Vector3(-108.364, 6193.305, 33.269), rotation: new mp.Vector3(-16.197, 0.0, -11.594) },
    { name: "CHANGING ROOM", position: new mp.Vector3(-104.403, 6189.226, 33.28), rotation: new mp.Vector3(-23.299, 0.0, -11.569) },
    { name: "WAREHOUSE CORRIDOR 1", position: new mp.Vector3(-105.285, 6187.37, 35.396), rotation: new mp.Vector3(-28.929, 0.0, 119.823) },
    { name: "WAREHOUSE CORRIDOR 2", position: new mp.Vector3(-138.405, 6154.3, 35.396), rotation: new mp.Vector3(-19.055, 0.0, -35.573) },
    { name: "WAREHOUSE ENTRANCE", position: new mp.Vector3(-140.094, 6149.152, 35.021), rotation: new mp.Vector3(-17.756, 0.0, 158.877) },
    { name: "WAREHOUSE 1", position: new mp.Vector3(-146.757, 6155.764, 35.021), rotation: new mp.Vector3(-22.606, 0.0, 90.048) },
    { name: "WAREHOUSE 2", position: new mp.Vector3(-161.132, 6141.439, 35.021), rotation: new mp.Vector3(-18.189, 0.0, -11.208) },
    { name: "WAREHOUSE 3", position: new mp.Vector3(-165.481, 6139.103, 35.021), rotation: new mp.Vector3(-20.267, 0.0, 20.926) }
];

const CAMERA_FOV = 72.5;

// script variables
let scaleformHandle = 0;
let camera = null;
let cameraIndex = -1;
let cameraSoundId = 0;
let cameraFeedId = 0;

// script functions
function destroySecurityCamera() {
    mp.players.local.setInvincible(false);

    if (scaleformHandle) {
        mp.game.graphics.setScaleformMovieAsNoLongerNeeded(scaleformHandle);
        scaleformHandle = 0;
    }

    if (camera) {
        camera.destroy();
        camera = null;
        cameraIndex = -1;

        mp.game.cam.renderScriptCams(false, false, 0, true, false);
        mp.game.cam.setGameplayCamRelativeHeading(0.0);
        mp.game.cam.setGameplayCamRelativePitch(0.0, 1.0);
        mp.game.graphics.clearTimecycleModifier();
    }

    if (cameraSoundId) {
        mp.game.audio.stopScene("MP_CCTV_SCENE");
        mp.game.audio.stopSound(cameraSoundId);
        mp.game.audio.releaseSoundId(cameraSoundId);
        cameraSoundId = 0;
    }

    if (cameraFeedId) {
        mp.game.hud.thefeedRemoveItem(cameraFeedId);
        cameraFeedId = 0;
    }
}

// event handlers
function handleSecurityCamera() {
    if (camera == null) {
        return;
    }

    // draw security_cam
    mp.game.graphics.drawScaleformMovieFullscreen(scaleformHandle, 255, 255, 255, 255, 0);

    // handle camera changing
    let cameraIndexChanged = false;
    if (mp.game.pad.isDisabledControlJustPressed(2, 189)) {
        // previous cam
        cameraIndex--;
        if (cameraIndex < 0) {
            cameraIndex = CAMERA_DATA.length - 1;
        }

        cameraIndexChanged = true;
    } else if (mp.game.pad.isDisabledControlJustPressed(2, 190)) {
        // next cam
        cameraIndex++;
        if (cameraIndex >= CAMERA_DATA.length) {
            cameraIndex = 0;
        }

        cameraIndexChanged = true;
    }

    if (cameraIndexChanged) {
        mp.game.audio.playSoundFrontend(-1, "NAV_LEFT_RIGHT", "HUD_FRONTEND_DEFAULT_SOUNDSET", false);

        // update the location text
        mp.game.graphics.beginScaleformMovieMethod(scaleformHandle, "SET_LOCATION");
        mp.game.graphics.scaleformMovieMethodAddParamPlayerNameString(CAMERA_DATA[cameraIndex].name);
        mp.game.graphics.endScaleformMovieMethod();

        // update the camera
        const newPos = CAMERA_DATA[cameraIndex].position;
        const newRot = CAMERA_DATA[cameraIndex].rotation;
        camera.setParams(newPos.x, newPos.y, newPos.z, newRot.x, newRot.y, newRot.z, CAMERA_FOV, 0, 1, 1, 2);
    }
}

function cleanUp(player) {
    if (player === mp.players.local) {
        destroySecurityCamera();
    }
}

// data change handlers
// isSpectator is set using setOwnVariable so this runs just for the local player
async function onSpectatorStatusChange(entity, newStatus) {
    if (newStatus) {
        cameraIndex = 0;
        mp.players.local.setInvincible(true);

        // prepare security_cam
        scaleformHandle = mp.game.graphics.requestScaleformMovie("security_cam");
        await waitFor(() => mp.game.graphics.hasScaleformMovieLoaded(scaleformHandle));

        runScaleformMethod(scaleformHandle, "SET_LAYOUT", 0);
        runScaleformMethod(scaleformHandle, "SET_LOCATION", CAMERA_DATA[cameraIndex].name);
        runScaleformMethod(scaleformHandle, "SET_DETAILS", "38 : 06 : 35    5N/0BR2");
        runScaleformMethod(scaleformHandle, "SET_TIME");

        // clear the death effects
        mp.game.graphics.animpostfxStop("DeathFailMPIn");
        mp.game.cam.setEffect(0);

        // create the camera
        camera = mp.cameras.new("DEFAULT_SCRIPTED_CAMERA", CAMERA_DATA[cameraIndex].position, CAMERA_DATA[cameraIndex].rotation, CAMERA_FOV);
        camera.setActive(true);

        // activate the camera
        mp.game.cam.renderScriptCams(true, false, 0, true, false);
        mp.game.graphics.setTimecycleModifier("CAMERA_BW");
        mp.game.graphics.setTimecycleModifierStrength(1.0);

        // create the camera sound
        cameraSoundId = mp.game.audio.getSoundId();
        mp.game.audio.playSoundFrontend(cameraSoundId, "Background", "MP_CCTV_SOUNDSET", false);
        mp.game.audio.startScene("MP_CCTV_SCENE");

        // display controls
        mp.game.hud.thefeedFreezeNextPost();
        mp.game.hud.beginTextCommandThefeedPost("STRING");
        mp.game.hud.addTextComponentSubstringPlayerName("~INPUT_FRONTEND_LEFT~ Previous Camera~n~~INPUT_FRONTEND_RIGHT~ Next Camera");
        cameraFeedId = mp.game.hud.endTextCommandThefeedPostTickerWithTokens(false, false);
    } else {
        destroySecurityCamera();
    }
}

// register event handlers
mp.events.add({
    "render": handleSecurityCamera,
    "playerQuit": cleanUp
});

// register data change handlers
mp.events.addDataHandler("isSpectator", onSpectatorStatusChange);
