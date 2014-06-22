module.exports = orientUnderParent

// Utility - changes the parent but preserves global position + rotation
function orientUnderParent( target, parent ) {
  
  // calculate new pos
  var newPos = new THREE.Vector3()
  newPos.setFromMatrixPosition( target.matrixWorld )
  parent.worldToLocal( newPos )
  target.position = newPos
  
  // calculate new rot
  var newRot = new THREE.Quaternion()
  newRot.setFromRotationMatrix( target.matrixWorld )
  newRot.multiply( parent.quaternion.clone().inverse() )
  target.quaternion.copy( newRot )

  // attach to parent
  parent.add( target )

}
