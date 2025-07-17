import * as React from "react"
import Svg, { Path } from "react-native-svg"
const StatsSvg = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    data-name="Layer 1"
    viewBox="0 0 600 600"
    {...props}
  >
    <Path
      d="M244.44 76.39h111.11V437.5H244.44ZM188.89 187.5H77.78v250h111.11ZM550 493.06H50v30.55h500Zm-27.78-250H411.11V437.5h111.11Z"
      style={{
        fill: "#fff",
      }}
    />
  </Svg>
)
export default StatsSvg
