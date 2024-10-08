export async function waitFor(checkFn, timeout = 3000) {
    return new Promise((resolve, reject) => {
        const failAt = Date.now() + timeout;
        const check = function() {
            if (Date.now() > failAt) {
                reject(new Error("waitFor timed out"));
            } else if (checkFn()) {
                resolve();
            } else {
                setTimeout(check, 100);
            }
        };

        check();
    });
}

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
