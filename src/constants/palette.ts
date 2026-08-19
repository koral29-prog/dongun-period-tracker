export const lightPalette = {
  cream: '#FBF8F0', paper: '#FFFDF8', forest: '#174A32', forestDark: '#103824', moss: '#627C5D', sage: '#A6BCA0', sageSoft: '#E4EBE0', line: '#E7E2D6', ink: '#17251E', muted: '#667269', coral: '#D87362', coralSoft: '#F7DFD9', danger: '#A3483B', white: '#FFFFFF', primary: '#174A32', onPrimary: '#FFFFFF',
};

export const darkPalette: typeof lightPalette = {
  cream: '#0F1511', paper: '#171E19', forest: '#8FCBA4', forestDark: '#EDF5EF', moss: '#AFC1B1', sage: '#5D7C66', sageSoft: '#243329', line: '#313D34', ink: '#E8EEE9', muted: '#A6B0A8', coral: '#F08A78', coralSoft: '#4A2D28', danger: '#FF9A88', white: '#F7FBF8', primary: '#2F704D', onPrimary: '#F7FBF8',
};

export type AppPalette = typeof lightPalette;
export const palette = lightPalette;
