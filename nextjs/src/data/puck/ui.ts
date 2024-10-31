import { conf, mapPageConf } from "@/data/puck/config";

export function getPuckConfigForHostname(hostname: string) {
    // A place for config-level overrides for different host orgs
    return conf;
}

export function getMapPagePuckConfigForHostname(hostname: string) {
  // A place for config-level overrides for different host orgs
  return mapPageConf;
}