export class GaragePreviewHost{
  constructor(adapter){if(!adapter||typeof adapter.mount!=="function"||typeof adapter.show!=="function"||typeof adapter.dispose!=="function")throw new TypeError("Garage preview adapter must implement mount, show and dispose");this.adapter=adapter;this.mounted=false}
  async mount(element,options={}){if(this.mounted)throw new Error("Garage preview is already mounted");await this.adapter.mount(element,options);this.mounted=true}
  async show(selection){if(!this.mounted)throw new Error("Garage preview is not mounted");return this.adapter.show({carId:selection.car.id,cosmeticId:selection.cosmetic?.id||null,asset:selection.car.asset,palette:selection.cosmetic?.palette||null,preview:selection.car.preview})}
  resize(width,height,dpr=1){return this.mounted&&this.adapter.resize?.(width,height,dpr)}
  dispose(){if(this.mounted)this.adapter.dispose();this.mounted=false}
}

export function createFallbackPreview(){let root=null;return{mount(element){root=element;root.classList.add("fallback-preview")},show({asset,palette}){if(!root)return;root.style.setProperty("--car-primary",palette?.primary||"#32434b");root.style.setProperty("--car-secondary",palette?.secondary||"#9aacb5");root.dataset.previewState=asset.status==="ready"?"ready":"placeholder"},dispose(){root?.classList.remove("fallback-preview");root=null}}}
