export const TextDropShadow = () => (
  <svg
    css={{ marginTop: -8 }}
    xmlns='http://www.w3.org/2000/svg'
    width='230'
    height='230'
    viewBox='0 0 230 230'
    fill='none'
  >
    <g filter='url(#filter0_dd_1929_4788)'>
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M31 9C22.1634 9 15 16.1634 15 25V193C15 201.837 22.1634 209 31 209H199C207.837 209 215 201.837 215 193V25C215 16.1634 207.837 9 199 9H31ZM101.088 140H119.328L91.104 72.032H75.168L46.656 140H64.512L69.504 126.656H95.808L101.088 140ZM82.848 90.176L91.296 113.504H74.208L82.848 90.176ZM146.641 163.04C163.633 163.04 174.769 154.208 174.769 135.488V92.192H159.889V98.336H159.697C156.337 93.248 150.385 90.848 144.433 90.848C130.033 90.848 121.681 102.656 121.681 115.904C121.681 129.152 130.033 140.48 144.529 140.48C150.865 140.48 156.049 137.984 159.025 134.144H159.313V137.024C159.313 144.992 154.993 150.368 145.777 150.368C140.401 150.368 134.545 148.352 129.937 144.32L122.065 155.552C128.497 160.352 138.289 163.04 146.641 163.04ZM148.177 103.712C155.281 103.712 159.793 109.28 159.793 115.808C159.793 122.336 155.377 128 148.177 128C141.073 128 136.945 122.144 136.945 115.808C136.945 109.184 141.073 103.712 148.177 103.712Z'
        fill='white'
      />
    </g>
    <defs>
      <filter
        id='filter0_dd_1929_4788'
        x='0'
        y='0'
        width='230'
        height='230'
        filterUnits='userSpaceOnUse'
        colorInterpolationFilters='sRGB'
      >
        <feFlood floodOpacity='0' result='BackgroundImageFix' />
        <feColorMatrix
          in='SourceAlpha'
          type='matrix'
          values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0'
          result='hardAlpha'
        />
        <feOffset dy='1.34018' />
        <feGaussianBlur stdDeviation='4' />
        <feColorMatrix
          type='matrix'
          values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0'
        />
        <feBlend
          mode='normal'
          in2='BackgroundImageFix'
          result='effect1_dropShadow_1929_4788'
        />
        <feColorMatrix
          in='SourceAlpha'
          type='matrix'
          values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0'
          result='hardAlpha'
        />
        <feOffset dy='6' />
        <feGaussianBlur stdDeviation='7.5' />
        <feColorMatrix
          type='matrix'
          values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0'
        />
        <feBlend
          mode='normal'
          in2='effect1_dropShadow_1929_4788'
          result='effect2_dropShadow_1929_4788'
        />
        <feBlend
          mode='normal'
          in='SourceGraphic'
          in2='effect2_dropShadow_1929_4788'
          result='shape'
        />
      </filter>
    </defs>
  </svg>
)
