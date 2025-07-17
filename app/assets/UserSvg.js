import * as React from "react"
import Svg, { Defs, Path } from "react-native-svg"
/* SVGR has dropped some elements not supported by react-native-svg: style */
const UserSvg = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    id="Layer_1"
    data-name="Layer 1"
    viewBox="0 0 600 600"
    {...props}
  >
    <Defs></Defs>
    <Path
      d="M300 269.76A90.73 90.73 0 1 0 209.27 179 90.73 90.73 0 0 0 300 269.76ZM481.46 421a90.73 90.73 0 0 0-90.73-90.73H209.27A90.73 90.73 0 0 0 118.54 421v90.7h362.92Z"
      className="cls-1"
    />
  </Svg>
)
export default UserSvg
