export function runScaleformMethod(scaleformHandle, methodName, ...args) {
    if (mp.game.graphics.beginScaleformMovieMethod(scaleformHandle, methodName)) {
        for (const arg of args) {
            switch (typeof arg) {
                case "boolean":
                    mp.game.graphics.scaleformMovieMethodAddParamBool(arg);
                    break;

                case "string":
                    mp.game.graphics.scaleformMovieMethodAddParamPlayerNameString(arg);
                    break;

                case "number":
                    if (Number.isInteger(arg)) {
                        mp.game.graphics.scaleformMovieMethodAddParamInt(arg);
                    } else {
                        mp.game.graphics.scaleformMovieMethodAddParamFloat(arg);
                    }

                    break;

                default:
                    throw new TypeError(`Invalid argument type for ${methodName}`);
            }
        }

        mp.game.graphics.endScaleformMovieMethod();
    }
}
