import { ElementHandle } from 'puppeteer';
import { AdHandles } from './ad-scraper.js';

export async function splitChumbox(ad: ElementHandle) {
  return {
    adblade: await splitTopContextAd(ad, '.adblade-dyna a.description', 2),
    contentad: await splitTopContextAd(ad, '.ac_container', 0),
    feednetwork: await splitTopContextAd(ad, '.my6_item', 0),
    mgid: await splitTopContextAd(ad, '.mgline', 0),
    outbrain: await splitTopContextAd(ad, '.ob-dynamic-rec-container.ob-p', 0),
    revcontent: await splitTopContextAd(ad, '.rc-item', 0),
    taboola: await splitTopContextAd(ad, '.trc_spotlight_item.syndicatedItem', 0),
    zergnet: await splitTopContextAd(ad, '.zergentity', 0)
  }
}

/**
 * Splits a chumbox ad in the first party HTML context into multiple ads.
 * @param container The parent element of the whole chumbox
 * @param linkSelector CSS Selector for each individual link to click
 * @param parentDepth If the link does not visually cover the whole ad,
 *                    return a parent this many levels up for screenshots.
 * @returns If the link selector matches elements, it returns a list of tuples:
 *          [link to click, element to screenshot (null if link is sufficient)].
 *          Otherwise returns null.
 */
async function splitTopContextAd(
    container: ElementHandle, linkSelector: string, parentDepth: number) {
  let link = await container.$$(linkSelector);
  if (link.length === 0) {
    return null;
  }

  let fullAd = await Promise.all(link.map(async (l) => {
    //@ts-ignore
    let ec = await container.executionContext();
    if (ec) {
      let parentHandle = await ec.evaluateHandle((e: Element, depth: number) => {
        let current = e;
        for (let i = 0; i < depth; i++) {
          if (current.parentElement) {
            current = current.parentElement;
          }
        }
        return current;
      }, l, parentDepth);
      return parentHandle.asElement();
    }
    return null;
  }));
  let tuples: AdHandles[] = [];
  for (let i = 0; i < link.length; i++) {
    tuples.push({
      clickTarget: link[i],
      screenshotTarget: fullAd[i]
    });
  }
  return tuples;
}

async function google(containingElement: ElementHandle) {
  let adsbygoogle_outer = '[class="adsbygoogle"] iframe';
  // the google ads iframe might be nested under this

  const iframe = await containingElement.$('iframe[id^="google_ads"]');
  if (!iframe) {
    return;
  }
  const frame = await iframe.contentFrame();
  if (!frame) {
    return;
  }
  let textads = await frame.$$('a.rhtitle');
}

async function lockerdomePoll(containingElement: ElementHandle) {
  const iframe = await containingElement.$('iframe[src^="https://lockerdome"]');
  if (!iframe) {
    return;
  }
  const frame = await iframe.contentFrame();
  if (!frame) {
    return;
  }
  return frame.$('.button-unit');
}