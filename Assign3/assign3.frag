//============================================================================
// STUDENT NAME: Wang Siwei
// NUS User ID.: t0915995
// COMMENTS TO GRADER: 
//
//============================================================================

// FRAGMENT SHADER

#version 430 core

//============================================================================
// Indicates whether 
//   true  -- rendering the shadow map, or
//   false -- using the shadow map to render shadows.
//============================================================================
uniform bool RenderShadowMapMode;


//============================================================================
// Received from rasterizer.
//============================================================================
in vec3 wcPosition;  // Fragment's 3D position in world space.
in vec3 ecPosition;  // Fragment's 3D position in eye space.
in vec3 ecNormal;    // Fragment's normal vector in eye space.
in vec2 texCoord;    // Fragment's texture coordinates.


//============================================================================
// Matrices
//============================================================================
uniform mat4 ShadowMatrix;        // For transforming world-space point 
                                  //   to shadow-map space.


//============================================================================
// Light info.
//============================================================================
uniform vec3 LightPosition; // Given in eye space. Must be point light.
uniform vec3 LightAmbient;
//uniform vec3 LightDiffuse;  // Not used.
//uniform vec3 LightSpecular; // Not used.


//============================================================================
// Material info.
//============================================================================
uniform vec3 MatlAmbient;
uniform vec3 MatlDiffuse;
uniform vec3 MatlSpecular;
uniform float MatlShininess;


//============================================================================
// Texture maps and Shadow maps.
//============================================================================
layout (binding = 0) uniform sampler2DShadow ShadowMap;  // Shadow map.
layout (binding = 1) uniform sampler2D ProjectorImage;   // Image projected by projector.


//============================================================================
// Outputs.
//============================================================================
layout (location = 0) out vec4 FragColor;



/////////////////////////////////////////////////////////////////////////////
// Computes and returns the values of N_dot_L and R_dot_V_pow_n 
// in the Phong Illumination Equation.
/////////////////////////////////////////////////////////////////////////////
void PhongLighting(out float N_dot_L, out float R_dot_V_pow_n)
{
    vec3 viewVec = -normalize( ecPosition );
    vec3 necNormal = normalize( ecNormal );
    vec3 lightVec = normalize( LightPosition.xyz - ecPosition );
    vec3 reflectVec = reflect( -lightVec, necNormal );
    N_dot_L = max( 0.0, dot( necNormal, lightVec ) );
    float R_dot_V = max( 0.0, dot( reflectVec, viewVec ) );
    R_dot_V_pow_n = ( R_dot_V == 0.0 )? 0.0 : pow( R_dot_V, MatlShininess );
}



/////////////////////////////////////////////////////////////////////////////
// Draws the scene with projector's projection and shadows.
/////////////////////////////////////////////////////////////////////////////
void DrawSceneWithProjection()
{
    /////////////////////////////////////////////////////////////////////////////
    // TASK:
    // * Calculate the shadowmap coordinates of this fragment.
    // * Read from ProjectorImage.
    // * Use ShadowMap to determine how much the fragment is being 
    //   shadowed (shadowFact). Must use PCF as shown in Lecture 5.
    // * If a fragment is outside the FOV of the projector, it is
    //   considered in shadow.
    // * Compute lighting using projector's position as the light source
    //   position. Use Phong lighting model.
    // * Use the color retrieved from ProjectorImage as both the
    //   diffuse coefficient and specular coefficient of the light source
    //   for lighting the fragment.
    // * The light's ambient coefficient is LightAmbient (uniform variable).
    /////////////////////////////////////////////////////////////////////////////

    /////////////////////////////////
    // TASK: WRITE YOUR CODE HERE. //
    /////////////////////////////////
	
	vec4 ShadowCoord=ShadowMatrix*vec4(wcPosition,1);
	vec4 color=textureProj(ProjectorImage,ShadowCoord);
	float sum=0.0;
	sum+=textureProjOffset(ShadowMap,ShadowCoord,ivec2(-1,-1));
	sum+=textureProjOffset(ShadowMap,ShadowCoord,ivec2(-1,1));
	sum+=textureProjOffset(ShadowMap,ShadowCoord,ivec2(1,1));
	sum+=textureProjOffset(ShadowMap,ShadowCoord,ivec2(1,-1));
	float shadowFact=sum*0.25;

	//vec4 diffSpec=texture(ProjectorImage,texCoord);
	float N_dot_L,R_dot_V_pow_n;
	PhongLighting(N_dot_L,R_dot_V_pow_n);
    FragColor = vec4(  color.rgb*N_dot_L*shadowFact*MatlDiffuse+shadowFact*R_dot_V_pow_n*MatlSpecular*color.rgb+LightAmbient*MatlAmbient, 1);


 
	
	

}



/////////////////////////////////////////////////////////////////////////////
// Draws the scene's depth to the shadowmap.
/////////////////////////////////////////////////////////////////////////////
void DrawShadowMap()
{
    // Do nothing; fragment depth will be written automatically.
}



void main()
{
    if ( RenderShadowMapMode )
        DrawShadowMap();
    else 
        DrawSceneWithProjection();

    // Use the following line to disable Early Z Testing, which may 
    // mess up the shadowmap and/or depth comparison on some systems.
    gl_FragDepth = gl_FragCoord.z;
}
