function myPerspective( m, fovy, aspect, zNear, zFar ) {

	var sine, cotangent, deltaZ;
	var radians=(fovy/2.0*Math.PI/180.0);

	m.elements[1] = 0;
	m.elements[2] = 0;
	m.elements[3] = 0;

	m.elements[4] = 0;
	m.elements[6] = 0;
	m.elements[7] = 0;

	m.elements[8] = 0;
	m.elements[9] = 0;

	m.elements[12] = 0;
	m.elements[13] = 0;

	deltaZ=zFar-zNear;
	sine=Math.sin(radians);
	if ((deltaZ===0.0) || (sine===0.0) || (aspect===0.0) )
	{
		return;
	}
	cotangent=Math.cos(radians)/sine;

	m.elements[0+0] = cotangent / aspect;
	 m.elements[4+1] = cotangent;
//		#if defined( _D3D_DRIVER ) || defined( _D3D10_DRIVER )
//		    m[2][2] = (zFar + zNear) / deltaZ;
//		    m[2][3] = 1.0f;
//		    m[3][2] = -1.0f * zNear * zFar / deltaZ;
//		#else
	m.elements[8+2] = -(zFar + zNear) / deltaZ;
	m.elements[8+3] = -1.0;
	 m.elements[12+2] = -2.0 * zNear * zFar / deltaZ;
//		#endif
	 m.elements[12+3] = 0;
	 m.origin.x = m.elements[12]
	 m.origin.y = m.elements[13]
	 m.origin.z = m.elements[14]
//#ifdef ALLOW_SETTING_GL1_MATRIX
//		 glMultMatrixf(&m[0][0]);
//	#endif
}

export {myPerspective}