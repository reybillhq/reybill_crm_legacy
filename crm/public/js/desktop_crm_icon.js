/* CRM-only presentation for native and saved layouts; never persist this copy. */
(() => {
  function normalize(icons, branding) {
    const apps = icons.filter((icon) => icon.app === "crm" && icon.icon_type === "App");
    if (!apps.length) return icons;
    const canonical = apps.find((icon) => icon.hidden != 1) || apps[0];
    const workspaces = branding.legacy_workspaces || {};
    return icons.flatMap((icon) => {
      if (icon.app === "crm" && icon.icon_type === "App") {
        return icon === canonical
          ? [{ ...icon, label: branding.name, logo_url: branding.src }]
          : [];
      }
      if (canonical.hidden != 1 && icon.icon_type === "Link" &&
          icon.link_type === "Workspace Sidebar" && icon.name === icon.link_to &&
          Object.hasOwn(workspaces, icon.link_to) && icon.app === workspaces[icon.link_to]) {
        return [];
      }
      return [icon];
    });
  }
  function install(desktop) {
    if (!desktop?.prepare || desktop.prepare.crm_app_icon) return;
    const prepare = desktop.prepare;
    function prepare_crm_icon(...args) {
      const branding = frappe.boot.crm_app_icon;
      const key = this.edit_mode ? "new_desktop_icons" : "desktop_icons";
      if (branding && Array.isArray(frappe[key])) {
        frappe[key] = normalize(frappe[key], branding);
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
