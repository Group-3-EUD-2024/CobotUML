/**
 * generated by Xtext 2.36.0
 */
package dk.sdu.bdd.xtext.bddDsl;

import org.eclipse.emf.ecore.EObject;

/**
 * <!-- begin-user-doc -->
 * A representation of the model object '<em><b>Property Ref</b></em>'.
 * <!-- end-user-doc -->
 *
 * <p>
 * The following features are supported:
 * </p>
 * <ul>
 *   <li>{@link dk.sdu.bdd.xtext.bddDsl.PropertyRef#getProperty <em>Property</em>}</li>
 *   <li>{@link dk.sdu.bdd.xtext.bddDsl.PropertyRef#getPropertyValue <em>Property Value</em>}</li>
 * </ul>
 *
 * @see dk.sdu.bdd.xtext.bddDsl.BddDslPackage#getPropertyRef()
 * @model
 * @generated
 */
public interface PropertyRef extends EObject
{
  /**
   * Returns the value of the '<em><b>Property</b></em>' reference.
   * <!-- begin-user-doc -->
   * <!-- end-user-doc -->
   * @return the value of the '<em>Property</em>' reference.
   * @see #setProperty(PropertyDef)
   * @see dk.sdu.bdd.xtext.bddDsl.BddDslPackage#getPropertyRef_Property()
   * @model
   * @generated
   */
  PropertyDef getProperty();

  /**
   * Sets the value of the '{@link dk.sdu.bdd.xtext.bddDsl.PropertyRef#getProperty <em>Property</em>}' reference.
   * <!-- begin-user-doc -->
   * <!-- end-user-doc -->
   * @param value the new value of the '<em>Property</em>' reference.
   * @see #getProperty()
   * @generated
   */
  void setProperty(PropertyDef value);

  /**
   * Returns the value of the '<em><b>Property Value</b></em>' attribute.
   * <!-- begin-user-doc -->
   * <!-- end-user-doc -->
   * @return the value of the '<em>Property Value</em>' attribute.
   * @see #setPropertyValue(String)
   * @see dk.sdu.bdd.xtext.bddDsl.BddDslPackage#getPropertyRef_PropertyValue()
   * @model
   * @generated
   */
  String getPropertyValue();

  /**
   * Sets the value of the '{@link dk.sdu.bdd.xtext.bddDsl.PropertyRef#getPropertyValue <em>Property Value</em>}' attribute.
   * <!-- begin-user-doc -->
   * <!-- end-user-doc -->
   * @param value the new value of the '<em>Property Value</em>' attribute.
   * @see #getPropertyValue()
   * @generated
   */
  void setPropertyValue(String value);

} // PropertyRef
