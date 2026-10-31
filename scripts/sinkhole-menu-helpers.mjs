// Browser fixtures follow the real front end instead of bypassing it.
export async function enterWorldMenu(page){
 if(await page.locator('#title-screen').isVisible())await page.locator(await page.locator('#title-browse').isVisible()?'#title-browse':'#title-play').click();
}
export async function clickOption(page,id){
 const open=await page.locator('#options-menu').isVisible();
 if(!open)await page.locator('#settings-open').click();
 await page.locator('#'+id).click();
 if(!open)await page.locator('#close-options').click();
}
export async function openCollection(page){
 await page.locator('#customize').click();
 if(!await page.locator('#save-tools').evaluate(e=>e.open))await page.locator('#save-tools summary').click();
}
