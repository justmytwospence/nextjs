import log from "loglevel";

const level = process.env.LOG_LEVEL || "info";
log.setLevel(level as log.LogLevelDesc);

export const baseLogger = log;
