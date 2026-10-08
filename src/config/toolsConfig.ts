/**
 * Global Configuration for the Google Developer Tools Hub.
 *
 * ⚙️ CONTROLS:
 * - `ENABLED: true`  => Activates the Google Tools hub across the entire site
 *                        (Header nav, Mobile drawer, Home page section, and /tools route).
 * - `ENABLED: false` => COMPLETELY disables and hides the Tools hub everywhere
 *                        (zero render, /tools redirects to home, nav links hidden).
 * - `SHOW_IN_NAV`    => Controls presence in top header & mobile drawer.
 * - `SHOW_ON_HOME_PAGE` => Controls preview section on the home page.
 */
export const TOOLS_CONFIG = {
  /**
   * Master Toggle:
   * Set to `true` to display the Tools section & page.
   * Set to `false` to disable and hide the entire Tools feature.
   */
  ENABLED: true,

  /**
   * Navigation Toggle:
   * Set to `true` to display "Tools" in the desktop navigation bar and mobile drawer.
   */
  SHOW_IN_NAV: true,

  /**
   * Home Page Preview Section:
   * Set to `true` to display the Tools showcase section on the homepage.
   */
  SHOW_ON_HOME_PAGE: true,

  /**
   * Header and Metadata Display Strings
   */
  PAGE_TITLE: 'Google Developer Tools',
  PAGE_SUBTITLE: 'An exhaustive directory of Google frameworks, platforms, APIs, and AI models for campus developers.',
  SECTION_TITLE: 'EXPLORE GOOGLE TOOLS',
  SECTION_SUBTITLE: 'Build faster with Google industry-standard developer platforms, APIs, and AI models.',
};
