export const stackStyles = {
  marginTop: 6,
  marginBottom: 2,
  flexWrap: 'wrap',
};

export const titleStyles = {
  fontWeight: 'bold',
  mb: 2
};

export const buttonStyles = {
  fontSize: '1.2rem',
  textTransform: 'none',
};

export const rowBoxStyles = {
  display: 'flex',
  alignItems: 'flex-start',
  flexWrap: 'wrap', 
  gap: 4,
  marginBottom: 4,
};

export const textFieldStyles = {
  minWidth: '200px',
  minheight: '40px',
  '& .MuiOutlinedInput-root': {
    height: '40px',
    backgroundColor: 'grey.300',
    border: 'none',
    '& fieldset': { display: 'none' },
    '&:hover fieldset': { display: 'none' },
    '&.Mui-focused fieldset': { display: 'none' },
  },
};

export const multiLineTextFieldStyles = {
  minWidth: '200px',
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'grey.300',
    border: 'none',
    '& fieldset': { display: 'none' },
    '&:hover fieldset': { display: 'none' },
    '&.Mui-focused fieldset': { display: 'none' },
  },
};


export const numFieldStyles = {
  maxWidth: '150px',
  height: '40px',
  '& .MuiOutlinedInput-root': {
    height: '40px',
    backgroundColor: 'grey.300',
    border: 'none',
    '& fieldset': { display: 'none' },
    '&:hover fieldset': { display: 'none' },
    '&.Mui-focused fieldset': { display: 'none' },
  },
};

export const toggleButtonGroupStyles = {
  maxWidth: '250px',
  height: '40px',
  '& .MuiToggleButton-root': {
    backgroundColor: 'grey.400',
    color: 'black',
    height: '40px',
    textTransform: 'none',
    '&:hover': {
      backgroundColor: 'grey.500',
    },
    '&.Mui-selected': {
      backgroundColor: 'secondary.main',
      color: 'secondary.contrastText',
      '&:hover': {
        backgroundColor: 'secondary.dark',
      }
    }
  }
};

export const backContinueContainerStyles = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 2,
  marginTop: 4,
  marginBottom: 4,
};
