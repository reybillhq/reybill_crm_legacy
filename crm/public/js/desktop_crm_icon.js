/* Keep cached/saved CRM app tiles current without changing their layout or identity. */
(() => {
  function install(desktop) {
    if (!desktop?.prepare || desktop.prepare.crm_app_icon) return;
    const prepare = desktop.prepare;
    function prepare_crm_icon(...args) {
      const branding = frappe.boot.crm_app_icon;
      const key = this.edit_mode ? "new_desktop_icons" : "desktop_icons";
      if (branding && Array.isArray(frappe[key])) {
        frappe[key] = frappe[key].map((icon) =>
          icon.app === "crm" && icon.icon_type === "App"
            ? { ...icon, label: branding.name, logo_url: branding.src }
            : icon
        );
      }
      return prepare.apply(this, args);
    }
    prepare_crm_icon.crm_app_icon = true;
    desktop.prepare = prepare_crm_icon;
  }
  const page = frappe.pages?.desktop;
  const load = page?.on_page_load;
  if (load && !load.crm_app_icon) {
    function load_crm_icon(...args) {
      const result = load.apply(this, args);
      install(page.desktop_page);
      return result;
    }
    load_crm_icon.crm_app_icon = true;
    page.on_page_load = load_crm_icon;
  }
  install(page?.desktop_page);
})();
