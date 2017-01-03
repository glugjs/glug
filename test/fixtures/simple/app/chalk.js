var chalk = {}
const span = classes => string => `<span class='${classes}'>${string}</span>`
const styles = ['red', 'blue', 'green', 'yellow', 'gray', 'cyan', 'bold', 'underline']
styles.forEach(style => {chalk[style] = span(style)})

export default chalk
